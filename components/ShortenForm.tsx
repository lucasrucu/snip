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
  const [label, setLabel] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: { url: string; label: string }) => {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Something went wrong");
      }
      return json.link as Link;
    },
    onSuccess: () => {
      setUrl("");
      setLabel("");
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
    mutation.mutate({ url: value, label: label.trim() });
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <Input
            type="text"
            inputMode="url"
            placeholder="Paste a long URL…"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="h-9"
            autoFocus
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="text"
              placeholder="Optional name (e.g. Headphones for mom)"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              className="h-9 flex-1"
              maxLength={120}
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
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
