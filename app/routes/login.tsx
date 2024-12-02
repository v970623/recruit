import { ActionFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import bcrypt from "bcrypt";
import React from "react";
import { prisma } from "../utils/db.server";
import { createUserSession } from "../utils/session.server";

type ActionData = {
  error?: string;
  fields?: {
    email: string;
    password: string;
  };
};

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const email = form.get("email") as string;
  const password = form.get("password") as string;

  if (!email || !password) {
    return json<ActionData>(
      { error: "邮箱和密码都是必填的", fields: { email, password } },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return json<ActionData>(
      { error: "用户不存在", fields: { email, password } },
      { status: 400 }
    );
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return json<ActionData>(
      { error: "密码错误", fields: { email, password } },
      { status: 400 }
    );
  }

  return createUserSession(user.id, "/jobs");
}

// 登录页面
export default function Login() {
  const actionData = useActionData<ActionData>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-lg w-full space-y-6 p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-2xl font-serif text-gray-800 mb-4">
          登录到您的账户
        </h1>
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
          <div className="flex justify-end">
            <a
              href="/register"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              注册新账号
            </a>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
          >
            登录
          </button>
        </Form>
      </div>
    </div>
  );
}
