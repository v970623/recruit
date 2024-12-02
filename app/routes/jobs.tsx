import { json } from "@remix-run/node";
import React from "react";
import { Outlet, Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { requireUser } from "../utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  return json({
    isRecruiter: user.role === "RECRUITER",
  });
}

export default function JobsPage() {
  const { isRecruiter } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  );
}
