import React from 'react';
import { useAuthStore } from '../../store/auth';
import { Avatar } from './Avatar';
import type { Member } from '../../domain/entities';

interface Props {
  member: Member;
  size?: 'sm' | 'md' | 'lg';
}

export function MemberAvatar({ member, size = 'md' }: Props) {
  const currentMemberId = useAuthStore((s) => s.currentMemberId);
  const avatarColor     = useAuthStore((s) => s.avatarColor);

  return (
    <Avatar
      initial={member.initial}
      color={member.color}
      size={size}
      bgHex={member.id === currentMemberId ? avatarColor : undefined}
    />
  );
}
