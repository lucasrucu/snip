"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime, shortLinkBase } from "@/lib/utils";
import type { Link } from "@/lib/types";

type Preview = {
  title: string | null;
  image: string | null;
  favicon: string;
  domain: string;
};

async function fetchLinks(): Promise<Link[]> {
  const res = await fetch("/api/links");
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? "Failed to load links");
  }
  return json.links as Link[];
}

async function fetchPreview(url: string): Promise<Preview> {
  const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
  if (!res.ok) {
    throw new Error("Failed to load preview");
  }
  return (await res.json()) as Preview;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}

function LinkThumb({
  preview,
  fallbackDomain,
  loading,
}: {
  preview?: Preview;
  fallbackDomain: string;
  loading: boolean;
}) {
  // Try og:image / screenshot first, then favicon, then a letter tile.
  const [failedIdx, setFailedIdx] = useState(0);
  const candidates = [preview?.image, preview?.favicon].filter(Boolean) as string[];
  const src = candidates[failedIdx];
  const initial = (preview?.domain ?? fallbackDomain).charAt(0).toUpperCase();

  if (loading) {
    return <div className="size-12 shrink-0 animate-pulse rounded-md bg-muted" />;
  }
  if (!src) {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-sm font-medium text-muted-foreground">
        {initial}
      </div>
    );
  }
  return (
    <div className="size-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="size-full object-cover"
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setFailedIdx((i) => i + 1)}
      />
    </div>
  );
}

function LinkRow({
  link,
  base,
  onDelete,
  deleting,
}: {
  link: Link;
  base: string;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const { data: preview, isLoading } = useQuery({
    queryKey: ["preview", link.target_url],
    queryFn: () => fetchPreview(link.target_url),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
  const [copied, setCopied] = useState(false);

  const domain = preview?.domain ?? hostnameOf(link.target_url);
  const title = preview?.title || domain;
  const shortUrl = `${base}/${link.slug}`;
  const shortDisplay = `${base.replace(/^https?:\/\//, "")}/${link.slug}`;

  async function copy() {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <LinkThumb preview={preview} fallbackDomain={domain} loading={isLoading} />

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium" title={title}>
            {title}
          </p>
          <a
            href={shortUrl}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-xs font-medium text-primary hover:underline"
          >
            {shortDisplay}
          </a>
          <p className="truncate text-xs text-muted-foreground">{domain}</p>
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
            onClick={copy}
            aria-label="Copy short link"
          >
            {copied ? (
              <Check className="size-3.5 text-primary" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(link.id)}
            disabled={deleting}
            aria-label="Delete short link"
          >
            <Trash2 className="size-3.5 text-negative" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function LinksList() {
  const queryClient = useQueryClient();
  const { data: links, isLoading, isError } = useQuery({
    queryKey: ["links"],
    queryFn: fetchLinks,
  });

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

  const base = shortLinkBase();

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

  const deletingId = del.isPending ? (del.variables as string) : null;

  return (
    <div className="flex flex-col gap-2">
      {links.map((link) => (
        <LinkRow
          key={link.id}
          link={link}
          base={base}
          onDelete={(id) => del.mutate(id)}
          deleting={deletingId === link.id}
        />
      ))}
    </div>
  );
}
