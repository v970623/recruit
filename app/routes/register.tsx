import { ActionFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import bcrypt from "bcrypt";
import React, { useState } from "react";
import { prisma } from "../utils/db.server";
import { createUserSession } from "../utils/session.server";

type ActionData = {
  error?: string;
  fields?: {
    email?: string;
    name?: string;
    role?: string;
  };
};

const ROLES = {
  APPLICANT: "求职者",
  RECRUITER: "招聘方",
  ADMIN: "管理员",
} as const;

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const email = form.get("email") as string;
  const password = form.get("password") as string;
  const name = form.get("name") as string;
  const role = form.get("role") as string;
  const code = form.get("code") as string;

  // 表单验证
  if (!email || !password || !name || !role) {
    return json<ActionData>(
      {
        error: "所有字段都是必填项",
        fields: {
          email: email || undefined,
          name: name || undefined,
          role: role || undefined,
        },
      },
      { status: 400 }
    );
  }

  // 密码长度验证
  if (password.length < 6) {
    return json<ActionData>(
      {
        error: "密码长度至少为6位",
        fields: { email, name, role },
      },
      { status: 400 }
    );
  }

  // 检查邮箱是否已存在
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return json<ActionData>(
      {
        error: "该邮箱已被注册",
        fields: { email },
      },
      { status: 400 }
    );
  }

  // 验证管理员注册码
  if (role === "ADMIN" && code !== "9999") {
    return json<ActionData>(
      {
        error: "管理员注册码无效",
        fields: { email, name, role },
      },
      { status: 400 }
    );
  }

  // 创建新用户
  const hashedPassword = await bcrypt.hash(password, 10);
  const now = new Date();
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
      createdAt: now,
      updatedAt: now,
    },
  });

  return createUserSession(user.id, "/jobs");
}

export default function Register() {
  const actionData = useActionData<ActionData>();
  const [selectedRole, setSelectedRole] = useState(
    actionData?.fields?.role || "APPLICANT"
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-lg w-full space-y-6 p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-2xl font-serif text-gray-800 mb-4">创建新账号</h1>
        {actionData?.error && (
          <div className="bg-red-100 text-red-600 p-4 rounded-md">
            {actionData.error}
          </div>
        )}
        <Form method="post" className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-600"
            >
              邮箱地址
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              defaultValue={actionData?.fields?.email}
            />
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-600"
            >
              姓名
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              defaultValue={actionData?.fields?.name}
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-600"
            >
              注册身份
            </label>
            <select
              id="role"
              name="role"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {Object.entries(ROLES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-600"
            >
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>

          {selectedRole === "ADMIN" && (
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-600"
              >
                管理员注册码
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="请输入管理员注册码"
              />
            </div>
          )}

          <div className="flex justify-end">
            <a
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              已有账号？去登录
            </a>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
          >
            注册
          </button>
        </Form>
      </div>
    </div>
  );
}
