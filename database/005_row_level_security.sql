alter table districts enable row level security;

create policy "Users can view their own districts"
on districts
for select
using (
    auth.uid() = user_id
);

create policy "Users can create their own districts"
on districts
for insert
with check (
    auth.uid() = user_id
);

create policy "Users can update their own districts"
on districts
for update
using (
    auth.uid() = user_id
);

create policy "Users can delete their own districts"
on districts
for delete
using (
    auth.uid() = user_id
);