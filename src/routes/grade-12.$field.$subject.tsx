import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/grade-12/$field/$subject")({
  component: Redirect,
});

function Redirect() {
  const { subject } = Route.useParams();
  return <Navigate to="/subject/$subjectId" params={{ subjectId: subject }} replace />;
}
