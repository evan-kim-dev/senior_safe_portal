export async function readCategoryId(request: Request): Promise<string> {
  try {
    const body = (await request.json()) as { categoryId?: string };
    return typeof body.categoryId === "string" ? body.categoryId.trim() : "";
  } catch {
    return "";
  }
}
