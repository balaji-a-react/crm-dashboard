"use client";
import { Button } from "@/components/ui/button";



export default function Home() {
  return (
   <div className="flex min-h-svh items-center justify-center">
      <Button onClick={() => console.log("Button clicked!")}>
        Click me
      </Button>
    </div>
  );
}
