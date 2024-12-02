import React from "react";
import { json, redirect } from "@remix-run/node";
import { JobForm } from "../components/JobForm";
import { prisma } from "../utils/db.server";
import { requireUser } from "../utils/auth.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  // 只允许招聘方访问
  if (user.role !== "RECRUITER") {
    throw new Response("无权访问", { status: 403 });
  }
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  // 只允许招聘方创建职位
  if (user.role !== "RECRUITER") {
    throw new Response("无权创建职位", { status: 403 });
  }

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const salary = formData.get("salary") ? Number(formData.get("salary")) : null;

  await prisma.job.create({
    data: {
      title,
      description,
      location,
      salary,
      publisherId: user.id,
      status: "OPEN",
    },
  });

  return redirect("/jobs");
}

export default function NewJobPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-serif text-gray-700 tracking-wider uppercase mb-8 text-center">
          发布新职位
        </h1>
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
          <JobForm action="/jobs/new" />
        </div>
      </div>
    </div>
  );
}
