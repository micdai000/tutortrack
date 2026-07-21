alter table districts enable row level security;

-- Allow authenticated tutors to manage only their own districts
create policy "Users can view their own districts"
on districts
for select
to authenticated
using (
    auth.uid() = user_id
);

create policy "Users can create their own districts"
on districts
for insert
to authenticated
with check (
    auth.uid() = user_id
);

create policy "Users can update their own districts"
on districts
for update
to authenticated
using (
    auth.uid() = user_id
)
with check (
    auth.uid() = user_id
);

create policy "Users can delete their own districts"
on districts
for delete
to authenticated
using (
    auth.uid() = user_id
);
