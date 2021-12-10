import { Component, createSignal } from "solid-js";
import { Router, Routes, Route, Link } from "solid-app-router";
import HomePage from "./pages";
import SnakePage from "./pages/Snake.page";
import { playYourselfAgent } from "./agent/playYourself.agent";

const App: Component = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/snake">
        <Route path="/" element={<SnakePage agent={playYourselfAgent} />} />
      </Route>
    </Routes>
  );
};

export default App;
