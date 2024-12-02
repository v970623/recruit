import React from "react";
import { prisma } from "../utils/db.server";
import {
  json,
  redirect,
  unstable_parseMultipartFormData,
  unstable_createMemoryUploadHandler,
  unstable_composeUploadHandlers,
} from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { requireUser } from "../utils/auth.server";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { uploadFile } from "../utils/s3.server";

type ActionData = {
  error?: string;
};

interface UploadHandlerArgs {
  name: string;
  contentType: string | null;
  data: AsyncIterable<Uint8Array>;
  filename?: string;
}
export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);

  let uploadedFileName = "";
  let uploadedContentType = "";
  let fileBuffer: Buffer | null = null;

  try {
    const customUploadHandler = async ({
      name,
      contentType,
      data,
      filename,
    }: UploadHandlerArgs) => {
      if (name !== "resume") {
        return undefined;
      }

      if (!contentType || !filename) {
        throw new Error("缺少文件类型或文件名");
      }

      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(contentType)) {
        throw new Error("不支持的文件类型");
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of data) {
        chunks.push(chunk);
      }

      fileBuffer = Buffer.concat(chunks);
      uploadedFileName = filename;
      uploadedContentType = contentType;

      return filename;
    };

    const uploadHandler = unstable_composeUploadHandlers(
      customUploadHandler,
      unstable_createMemoryUploadHandler()
    );

    const formData = await unstable_parseMultipartFormData(
      request,
      uploadHandler
    );
    const coverLetter = formData.get("coverLetter") as string | null;
    const resumeFilename = formData.get("resume") as string | null;

    if (!fileBuffer || !uploadedFileName || !uploadedContentType) {
      return json<ActionData>(
        { error: "请上传有效的简历文件" },
        { status: 400 }
      );
    }

    if (!coverLetter) {
      return json<ActionData>({ error: "求职信不可为空" }, { status: 400 });
    }

    if (!params.jobId) {
      return json<ActionData>({ error: "职位 ID 无效" }, { status: 400 });
    }

    const fileExtension = uploadedFileName.split(".").pop() || "pdf";
    const fileName = `resumes/${params.jobId}/${
      user.id
    }-${Date.now()}.${fileExtension}`;

    await uploadFile(fileBuffer, fileName, uploadedContentType);

    await prisma.application.create({
      data: {
        coverLetter,
        status: "PENDING",
        resumeUrl: fileName,
        applicantId: user.id,
        jobId: params.jobId,
      },
    });

    return redirect(`/jobs/${params.jobId}`);
  } catch (error) {
    return json<ActionData>(
      {
        error:
          error instanceof Error
            ? error.message
            : "申请提交失败，请确保文件格式正确并且大小不超过 2MB",
      },
      { status: 500 }
    );
  }
}

export default function ApplyJob() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="relative max-w-2xl mx-auto my-12 p-6 bg-white border border-gray-200 shadow-md rounded-lg">
      {isSubmitting && (
        <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
          <div className="w-12 h-12 border-4 border-gray-400 border-t-gray-800 rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-600 text-lg font-medium">
            正在提交申请...
          </p>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-800 mb-6">申请职位</h2>
      {actionData?.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {actionData.error}
        </div>
      )}
      <Form method="post" encType="multipart/form-data" className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            求职信
          </label>
          <textarea
            name="coverLetter"
            rows={4}
            className="block w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white"
            placeholder="请填写您的求职信"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            简历
          </label>
          <input
            type="file"
            name="resume"
            accept=".pdf,.doc,.docx"
            className="block w-full text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white"
            required
          />
          <p className="mt-2 text-sm text-gray-500">
            支持 PDF 或 Word 格式，最大 2MB
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-3 text-white bg-gray-900 hover:bg-gray-800 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "提交中..." : "提交申请"}
        </button>
      </Form>
    </div>
  );
}
