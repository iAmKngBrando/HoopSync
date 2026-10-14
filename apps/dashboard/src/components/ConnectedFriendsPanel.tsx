import { MessageCircle } from 'lucide-react';
import type { ConnectedFriend } from '../types';
import { Card, SectionHeader } from './ui/Card';
import { Avatar } from './ui/Avatar';

const colors = ['#3b82f6', '#a855f7', '#f97316', '#ef3b3b'];

export function ConnectedFriendsPanel({ friends }: { friends: ConnectedFriend[] }) {
  return (
    <Card>
      <SectionHeader title="CONNECTED FRIENDS" action={<span className="text-xs font-semibold text-success">{friends.length} ONLINE</span>} />
      <ul className="flex flex-col gap-2.5">
        {friends.map((f, i) => (
          <li key={f.id} className="flex items-center gap-3">
            <Avatar name={f.name} color={colors[i % colors.length] ?? '#64748b'} size={30} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{f.name}</div>
              <div className={f.streaming ? 'text-xs font-medium text-accent-blue' : 'text-xs text-muted-foreground'}>
                {f.status}
              </div>
            </div>
            <button type="button" className="text-foreground-secondary transition-colors hover:text-foreground">
              <MessageCircle size={15} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
