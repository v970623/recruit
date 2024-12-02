import { Form } from "@remix-run/react";
import React from "react";
import type { JobActionData } from "../types/job";

interface JobFormProps {
  actionData?: JobActionData;
  action?: string;
  isAdmin?: boolean;
  jobId?: string;
}

export function JobForm({ actionData, action, isAdmin, jobId }: JobFormProps) {
  return (
    <Form method="post" action={action} className="max-w-2xl mx-auto space-y-8">
      <div className="bg-gray-50 p-8 shadow-md rounded-lg border border-gray-300">
        <div className="mb-6">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            职位名称
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="w-full px-4 py-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 transition text-black"
            defaultValue={actionData?.fields?.title}
            required
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            职位描述
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 transition text-black"
            defaultValue={actionData?.fields?.description}
            required
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            工作地点
          </label>
          <input
            type="text"
            id="location"
            name="location"
            className="w-full px-4 py-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 transition text-black"
            defaultValue={actionData?.fields?.location}
            required
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="salary"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            薪资待遇
          </label>
          <input
            type="number"
            id="salary"
            name="salary"
            className="w-full px-4 py-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 transition text-black"
            defaultValue={actionData?.fields?.salary}
            min="0"
            step="1000"
          />
        </div>

        {actionData?.error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-300 p-4 rounded-md mb-6">
            {actionData.error}
          </div>
        )}

        {isAdmin ? (
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-gray-900 text-white px-6 py-3 rounded-md hover:bg-gray-800 transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              发布职位
            </button>
            {jobId && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm("确定要删除这个职位吗？")) {
                    await fetch(`/jobs/${jobId}`, {
                      method: "DELETE",
                    });
                    window.location.reload();
                  }
                }}
                className="px-6 py-3 text-red-500 hover:text-red-400 border border-red-500 hover:border-red-400 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                删除职位
              </button>
            )}
          </div>
        ) : (
          <button
            type="submit"
            className="w-full bg-gray-900 text-white px-6 py-3 rounded-md hover:bg-gray-800 transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            确认
          </button>
        )}
      </div>
    </Form>
  );
}
