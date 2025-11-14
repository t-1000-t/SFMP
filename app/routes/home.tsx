import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import CanvasDefault from "../src/components/CanvasDefault";
import ParticlePlayground from "~/src/components/ParticlePlayground";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <div>
      <ParticlePlayground />
      {/*<CanvasDefault />*/}
      {/* <Welcome /> */}
    </div>
  );
}
