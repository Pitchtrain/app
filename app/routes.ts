import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("welcome", "routes/welcome.tsx"),
  route("about", "routes/about.tsx"),
  route("imprint", "routes/imprint.tsx"),
  route("privacy", "routes/privacy.tsx"),
] satisfies RouteConfig;
