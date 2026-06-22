"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime, shortLinkBase } from "@/lib/utils";
import type { Link } from "@/lib/types";

async function fetchLinks(): Promise<Link[]> {
  const res = await fetch("/api/links");
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? "Failed to load links");
  }
  return json.links as Link[];
}

export function LinksList() {
  const queryClient = useQueryClient();
  const { data: links, isLoading, isError } = useQuery({
    queryKey: ["links"],
    queryFn: fetchLinks,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const base = shortLinkBase();

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to delete");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      toast.success("Link deleted");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    },
  });

  async function copy(link: Link) {
    await navigator.clipboard.writeText(`${base}/${link.slug}`);
    setCopiedId(link.id);
    toast.success("Copied to clipboard");
    setTimeout(() => {
      setCopiedId((current) => (current === link.id ? null : current));
    }, 1500);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-10 text-center text-sm text-negative">
        Couldn&rsquo;t load your links.
      </p>
    );
  }

  if (!links || links.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No links yet. Paste a URL above to create your first one.
      </p>
    );
  }

  const display = base.replace(/^https?:\/\//, "");

  return (
    <div className="flex flex-col gap-2">
      {links.map((link) => (
        <Card key={link.id} size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <a
                href={`${base}/${link.slug}`}
                target="_blank"
                rel="noreferrer"
                className="block truncate font-medium text-primary hover:underline"
              >
                {display}/{link.slug}
              </a>
              <p className="truncate text-xs text-muted-foreground">
                {link.target_url}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="text-xs text-muted-foreground tabular-nums">
                {link.click_count} {link.click_count === 1 ? "click" : "clicks"}
              </span>
              <span className="text-[0.7rem] text-muted-foreground">
                {formatRelativeTime(link.created_at)}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => copy(link)}
                aria-label="Copy short link"
              >
                {copiedId === link.id ? (
                  <Check className="size-3.5 text-primary" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => del.mutate(link.id)}
                disabled={del.isPending}
                aria-label="Delete short link"
              >
                <Trash2 className="size-3.5 text-negative" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
