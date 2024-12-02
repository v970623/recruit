import { ActionFunction } from "@remix-run/node";
import { logout } from "../utils/session.server";

export const action: ActionFunction = async ({ request }) => {
  return logout(request);
};
