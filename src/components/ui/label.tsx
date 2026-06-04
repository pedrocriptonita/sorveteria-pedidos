import * as React from "react";
import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "flex flex-col gap-1.5 text-sm font-medium leading-none",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
