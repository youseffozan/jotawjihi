import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { getField, type Field } from "@/lib/exam-data";

export const Route = createFileRoute("/grade-12/$field")({
  loader: ({ params }): { field: Field } => {
    const field = getField(params.field);
    if (!field) throw notFound();
    return { field };
  },
  component: () => <Outlet />,
});
