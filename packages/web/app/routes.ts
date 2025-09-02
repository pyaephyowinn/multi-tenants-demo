import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("tenant/:tenantId", "routes/tenant.layout.tsx", [
    index("routes/tenant.dashboard.tsx"),
    route("contacts", "routes/tenant.contacts.tsx"),
    route("contacts/new", "routes/tenant.contacts.new.tsx"),
    route("contacts/:contactId", "routes/tenant.contacts.$contactId.tsx"),
  ]),
] satisfies RouteConfig;
