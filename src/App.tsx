import { Component, createSignal } from "solid-js";
import { Router, Routes, Route, Link } from "solid-app-router";
import HomePage from "./pages";
import SnakePage from "./pages/Snake.page";

const App: Component = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/snake" element={<SnakePage />} />
    </Routes>
  );
};

export default App;
