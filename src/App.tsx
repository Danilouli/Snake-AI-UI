import { Component, createSignal } from "solid-js";
import { Router, Routes, Route, Link } from "solid-app-router";
import HomePage from "./pages/index.page";
import SnakePage from "./pages/snake/index.page";
import { createPlayYourselfAgent } from "./agent/playYourself.agent";
import { createNeuroEvolutionAgent } from "./agent/vincent/neuro-evolution.agent";
import NeuroEvolutionGymPage from "./pages/snake/vincent/gym/neuro-evolution.page";

const App: Component = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="snake">
        <Route
          path="/"
          element={<SnakePage agentFactory={createPlayYourselfAgent} />}
        />
        <Route path="daniel"></Route>
        <Route path="vincent">
          <Route
            path="neuro-evolution"
            element={<SnakePage agentFactory={createNeuroEvolutionAgent} />}
          />
          <Route path="gym">
            <Route path="neuro-evolution" element={<NeuroEvolutionGymPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
