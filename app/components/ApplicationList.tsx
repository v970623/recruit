import { Form, useLocation } from "@remix-run/react";
import type { Application, Job, User } from "@prisma/client";
import * as React from "react";

// 定义应用状态类型
type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

// 定义排序相关类型
type SortField = "appliedAt" | "status";
type SortOrder = "asc" | "desc";

type ApplicationWithDetails = Application & {
  applicant: Pick<User, "name" | "email">;
  job: Pick<Job, "title" | "publisherId">;
};

interface ApplicationListProps {
  applications: ApplicationWithDetails[];
  userRole: "ADMIN" | "RECRUITER";
  currentUserId?: string;
}

export default function ApplicationList({
  applications,
  userRole,
  currentUserId,
}: ApplicationListProps) {
  const [selectedApplication, setSelectedApplication] =
    React.useState<ApplicationWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    ApplicationStatus | "all"
  >("all");
  const [sortConfig, setSortConfig] = React.useState<{
    field: SortField;
    order: SortOrder;
  }>({
    field: "appliedAt",
    order: "desc",
  });
  const [isLoading, setIsLoading] = React.useState<string | null>(null);
  const location = useLocation();

  // 处理文件下载
  const handleFileAction = async (
    resumeUrl: string | null,
    action: "download" | "preview"
  ) => {
    if (!resumeUrl) {
      console.error("简历 URL 不存在");
      alert("简历不存在");
      return;
    }

    console.log("原始 URL:", resumeUrl);

    try {
      setIsLoading(resumeUrl);

      // 构建请求 URL
      const requestUrl = `/applications/download?key=${encodeURIComponent(
        resumeUrl
      )}`;
      console.log("发送请求到:", requestUrl);

      // 发送下载请求
      const response = await fetch(requestUrl);

      console.log("服务器响应状态:", response.status);

      // 如果响应不成功
      if (!response.ok) {
        const errorText = await response.text();
        console.error("错误响应内容:", errorText);

        let errorMessage = "下载失败";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error("解析错误响应失败:", e);
        }
        throw new Error(errorMessage);
      }

      // 尝试解析成功响应
      const responseText = await response.text();
      console.log("服务器响应内容:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log("解析后的响应数据:", data);
      } catch (e) {
        console.error("解析 JSON 响应失败:", e);
        console.error("响应内容:", responseText);
        throw new Error("服务器响应格式错误");
      }

      if (!data || typeof data !== "object") {
        console.error("响应不是有效的对象:", data);
        throw new Error("无效的服务器响应");
      }

      if (!data.url || typeof data.url !== "string") {
        console.error("响应中没有有效的 URL:", data);
        throw new Error("获取下载链接失败");
      }

      // 在新标签页中打开预签名 URL
      console.log("打开下载链接:", data.url);
      window.open(data.url, "_blank");
    } catch (error) {
      console.error("文件操作失败：", error);
      alert(error instanceof Error ? error.message : "操作失败，请稍后重试");
    } finally {
      setIsLoading(null);
    }
  };

  const canManageApplication = (application: ApplicationWithDetails) => {
    if (userRole === "ADMIN") return true;
    if (userRole === "RECRUITER") {
      return application.job?.publisherId === currentUserId;
    }
    return false;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-700 border border-amber-200";
      case "APPROVED":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "REJECTED":
        return "bg-rose-100 text-rose-700 border border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  if (!applications || applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg">
        <svg
          className="w-16 h-16 text-slate-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-slate-500 text-lg font-medium">暂无申请记录</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                申请人
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                职位
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                申请时间
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                简历
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {applications.map((application) => {
              if (!application.job) return null;

              return (
                <tr
                  key={application.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-slate-800">
                        {application.applicant.name || "未知"}
                      </div>
                      <div className="text-sm text-slate-500">
                        {application.applicant.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-800">
                      {application.job.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600">
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                        application.status
                      )}`}
                    >
                      {application.status === "PENDING" && "待处理"}
                      {application.status === "APPROVED" && "已通过"}
                      {application.status === "REJECTED" && "已拒绝"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {application.resumeUrl ? (
                      <div className="flex space-x-3">
                        <button
                          onClick={async () => {
                            await handleFileAction(
                              application.resumeUrl,
                              "download"
                            );
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          下载简历
                        </button>
                        {application.resumeUrl
                          .toLowerCase()
                          .endsWith(".pdf") && (
                          <button
                            onClick={async () => {
                              await handleFileAction(
                                application.resumeUrl,
                                "preview"
                              );
                            }}
                            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                          >
                            预览
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">未上传</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 shadow-md transition-colors"
                      >
                        查看详情
                      </button>
                      {canManageApplication(application) &&
                        application.status === "PENDING" && (
                          <div className="flex space-x-2">
                            <Form method="post">
                              <input
                                type="hidden"
                                name="applicationId"
                                value={application.id}
                              />
                              <input
                                type="hidden"
                                name="status"
                                value="APPROVED"
                              />
                              <button
                                type="submit"
                                name="_action"
                                value="updateStatus"
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"
                              >
                                通过
                              </button>
                            </Form>
                            <Form method="post">
                              <input
                                type="hidden"
                                name="applicationId"
                                value={application.id}
                              />
                              <input
                                type="hidden"
                                name="status"
                                value="REJECTED"
                              />
                              <button
                                type="submit"
                                name="_action"
                                value="updateStatus"
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-md transition-colors"
                              >
                                拒绝
                              </button>
                            </Form>
                          </div>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedApplication && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8 relative shadow-xl">
            <button
              onClick={() => setSelectedApplication(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h3 className="text-xl font-semibold text-slate-800 mb-6">
              申请详情
            </h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">
                  申请职位
                </h4>
                <p className="text-slate-800 font-medium">
                  {selectedApplication.job.title}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">
                  申请人
                </h4>
                <p className="text-slate-800 font-medium">
                  {selectedApplication.applicant.name}
                </p>
                <p className="text-slate-600 mt-1">
                  {selectedApplication.applicant.email}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">
                  申请时间
                </h4>
                <p className="text-slate-800">
                  {new Date(selectedApplication.appliedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">
                  求职信
                </h4>
                <p className="text-slate-800 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">
                  {selectedApplication.coverLetter}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">
                  简历
                </h4>
                {selectedApplication.resumeUrl ? (
                  <div className="flex space-x-4">
                    <button
                      onClick={async () => {
                        await handleFileAction(
                          selectedApplication.resumeUrl,
                          "download"
                        );
                      }}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                    >
                      下载简历
                    </button>
                    {selectedApplication.resumeUrl
                      .toLowerCase()
                      .endsWith(".pdf") && (
                      <button
                        onClick={async () => {
                          await handleFileAction(
                            selectedApplication.resumeUrl,
                            "preview"
                          );
                        }}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"
                      >
                        预览简历
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500">未上传简历</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
