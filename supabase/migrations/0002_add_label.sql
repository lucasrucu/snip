-- snip — add an optional user-given label to links.
-- Non-destructive: adds a nullable column, no data moved. Existing rows get NULL.

alter table public.links add column if not exists label text;
