import alchemy from "alchemy";
import { Vite } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/web/.env" });

const app = await alchemy("quiniela-mundial-2026");

export const web = await Vite("web", {
  cwd: "../../apps/web",
  assets: "dist",
  url: false,
  adopt: true,
  domains: [{ domainName: "quiniela.luisralda.com", adopt: true }],
  bindings: {
    VITE_CONVEX_URL: alchemy.env.VITE_CONVEX_URL!,
    VITE_CONVEX_SITE_URL: alchemy.env.VITE_CONVEX_SITE_URL!,
  },
});

console.log("Web    -> https://quiniela.luisralda.com");

await app.finalize();
