import type { Handler, Context } from "aws-lambda";

export const handler: Handler = async (_event: unknown, _context: Context) => {
  throw new Error("Oh no, an error!");
};
