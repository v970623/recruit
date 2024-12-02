import { json, redirect } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { Form, useActionData, useTransition } from "@remix-run/react";
import { useState } from "react";
import { prisma } from "~/utils/db.server";
import { getUserSession } from "~/utils/session.server";
import { uploadToS3 } from "~/utils/s3.server";
import ConfirmDialog from "~/components/ConfirmDialog";

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await getUserSession(request);
  if (!userId) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const coverLetter = formData.get("coverLetter") as string;
  const resumeFile = formData.get("resume") as File;

  let resumeUrl = null;
  if (resumeFile.size > 0) {
    resumeUrl = await uploadToS3(resumeFile);
  }

  const application = await prisma.application.create({
    data: {
      coverLetter,
      resumeUrl,
      applicantId: userId,
      jobId: params.jobId!,
      status: "PENDING",
    },
  });

  return json({ success: true, applicationId: application.id });
};

export default function ApplyJob() {
  const actionData = useActionData<typeof action>();
  const transition = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  // 当提交成功时显示确认框
  if (actionData?.success && !showConfirm) {
    setShowConfirm(true);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">申请职位</h1>
      <Form method="post" encType="multipart/form-data" className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            求职信
          </label>
          <textarea
            name="coverLetter"
            rows={6}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="请介绍一下你自己，以及为什么适合这个职位..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            简历 (PDF)
          </label>
          <input
            type="file"
            name="resume"
            accept=".pdf"
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <button
          type="submit"
          disabled={transition.state === "submitting"}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          {transition.state === "submitting" ? "提交中..." : "提交申请"}
        </button>
      </Form>

      {showConfirm && (
        <ConfirmDialog
          title="申请提交成功"
          message="我们已收到你的申请，招聘方会尽快查看并给出回复。"
          onClose={() => setShowConfirm(false)}
          redirectTo="/jobs"
        />
      )}
    </div>
  );
}
