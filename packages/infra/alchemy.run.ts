import alchemy from "alchemy";
import { Vite } from "alchemy/cloudflare";

const app = await alchemy("quiniela-mundial-2026");

export const web = await Vite("web", {
  cwd: "../../apps/web",
  assets: "dist",
  url: false,
  adopt: true,
  domains: [{ domainName: "quiniela.luisralda.com", adopt: true }],
});

console.log("Web estático -> https://quiniela.luisralda.com");

await app.finalize();
