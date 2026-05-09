"use client";

import { useState } from "react";
import FastInput from "./FastInput";
import FastStream from "./FastStream";

export default function FastPageContent() {
  const [idea, setIdea] = useState<string | null>(null);

  return idea ? <FastStream idea={idea} /> : <FastInput onSubmit={setIdea} />;
}
