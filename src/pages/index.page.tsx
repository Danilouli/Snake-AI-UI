import { Component, createSignal } from "solid-js";
import { Router, Routes, Route, Link } from "solid-app-router";

const HomePage = () => {
  return (
    <div>
      <div>Home Page</div>
      <Link href="/snake">
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Play Snake
        </button>
      </Link>
    </div>
  );
};

export default HomePage;
