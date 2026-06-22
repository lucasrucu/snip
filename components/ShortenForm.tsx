"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Link } from "@/lib/types";

export function ShortenForm() {
  const [url, setUrl] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (value: string) => {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Something went wrong");
      }
      return json.link as Link;
    },
    onSuccess: () => {
      setUrl("");
      queryClient.invalidateQueries({ queryKey: ["links"] });
      toast.success("Short link created");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create link");
    },
  });

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = url.trim();
    if (!value || mutation.isPending) return;
    mutation.mutate(value);
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="text"
            inputMode="url"
            placeholder="Paste a long URL…"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="h-9 flex-1"
            autoFocus
          />
          <Button
            type="submit"
            size="lg"
            disabled={mutation.isPending || !url.trim()}
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Shorten"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
