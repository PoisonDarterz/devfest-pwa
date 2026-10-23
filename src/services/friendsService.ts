import { supabase } from '../lib/supabase';
import type { FriendConnection } from '../lib/types';
import { USE_NODE_BACKEND, NODE_API_BASE_URL } from './apiConfig';
import { parseAttendeeIdentifier } from '../lib/qrParser';

export const friendsService = {
  // Fetch Friends Connections
  async getFriends(userEmail: string): Promise<FriendConnection[]> {
    if (!userEmail) return [];

    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/connections?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Node backend fetch failed for connections:', err);
      }
    }

    try {
      // Direct Supabase Fallback
      const { data: user } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', userEmail.toLowerCase())
        .maybeSingle();

      if (user?.id) {
        const { data, error } = await supabase
          .from('connections')
          .select('id, method, created_at, friend:profiles!connections_friend_id_fkey(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data
            .filter((row: any) => row.friend)
            .map((row: any) => {
              const f = row.friend;
              const nameParts = (f.full_name || 'Attendee').trim().split(/\s+/);
              const displayName =
                nameParts.length === 1 ? nameParts[0] : `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`;
              const initials =
                nameParts.length === 1
                  ? nameParts[0].slice(0, 2).toUpperCase()
                  : (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
              return {
                id: f.id,
                name: f.full_name || 'Attendee',
                displayName,
                role: f.company_role || 'Attendee',
                bio: f.bio || '',
                initials,
                color: 'bg-[#2A3A68]',
                githubUrl: f.github_url || '',
                linkedinUrl: f.linkedin_url || '',
                email: f.email || '',
                qrPayload: f.qr_payload || '',
                method: row.method || 'QR Scan',
                connectedAt: row.created_at,
              };
            });
        }
      }
    } catch (err) {
      console.warn('Database fallback query failed for connections:', err);
    }
    return [];
  },

  // Add Friend via QR Scan
  async addFriend(params: {
    userEmail: string;
    userId?: string;
    friendId?: string;
    qrPayload?: string;
    friendEmail?: string;
    method?: 'QR Scan' | 'Direct Link';
  }): Promise<{ success: boolean; friend?: FriendConnection; isMutual?: boolean; message: string }> {
    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/connections/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        const data = await res.json();
        return data;
      } catch (err) {
        console.warn('Node backend add friend failed:', err);
      }
    }

    // Direct Supabase Fallback
    try {
      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', params.userEmail.toLowerCase())
        .maybeSingle();

      if (!user) {
        return { success: false, message: 'User profile not found.' };
      }

      let friend: any = null;
      if (params.qrPayload) {
        const parsed = parseAttendeeIdentifier(params.qrPayload);
        if (parsed.pk) {
          const { data } = await supabase
            .from('vw_profiles')
            .select('*')
            .or(`external_ref_id.eq.${parsed.pk},qr_payload.ilike.%${parsed.pk}%,qr_payload.eq.${params.qrPayload}`)
            .limit(1)
            .maybeSingle();
          friend = data;
        } else {
          const candidate = parsed.cleanKey || params.qrPayload;
          const { data } = await supabase
            .from('vw_profiles')
            .select('*')
            .or(`qr_payload.eq.${candidate},external_ref_id.eq.${candidate},email.ilike.${candidate}`)
            .limit(1)
            .maybeSingle();
          friend = data;
        }
      }
      if (!friend && params.friendEmail) {
        const { data } = await supabase
          .from('vw_profiles')
          .select('*')
          .ilike('email', params.friendEmail.toLowerCase())
          .maybeSingle();
        friend = data;
      }

      if (!friend) {
        return { success: false, message: 'Attendee profile not found for this code.' };
      }

      if (user.id === friend.id) {
        return { success: false, message: 'You cannot connect with your own badge!' };
      }

      const method = params.method || 'QR Scan';
      await supabase.from('connections').upsert(
        {
          user_id: user.id,
          friend_id: friend.id,
          method,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,friend_id' }
      );

      const nameParts = (friend.full_name || 'Attendee').trim().split(/\s+/);
      const displayName =
        nameParts.length === 1 ? nameParts[0] : `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`;
      const initials =
        nameParts.length === 1
          ? nameParts[0].slice(0, 2).toUpperCase()
          : (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();

      return {
        success: true,
        friend: {
          id: friend.id,
          name: friend.full_name,
          displayName,
          role: friend.company_role || 'Attendee',
          bio: friend.bio || '',
          initials,
          color: 'bg-[#2D6E66]',
          githubUrl: friend.github_url || '',
          linkedinUrl: friend.linkedin_url || '',
          email: friend.email,
          qrPayload: friend.qr_payload,
          method,
          connectedAt: new Date().toISOString(),
        },
        isMutual: false,
        message: `Connected with ${friend.full_name}!`,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to save connection.' };
    }
  },

  // Get Friend Details
  async getFriendDetails(friendId: string): Promise<FriendConnection | null> {
    if (USE_NODE_BACKEND) {
      try {
        const res = await fetch(`${NODE_API_BASE_URL}/connections/details/${friendId}`);
        if (res.ok) {
          const data = await res.json();
          return data.friend;
        }
      } catch (err) {
        console.warn('Node backend friend details failed:', err);
      }
    }

    try {
      const { data: friend } = await supabase.from('profiles').select('*').eq('id', friendId).maybeSingle();
      if (friend) {
        const nameParts = (friend.full_name || 'Attendee').trim().split(/\s+/);
        const displayName =
          nameParts.length === 1 ? nameParts[0] : `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`;
        const initials =
          nameParts.length === 1
            ? nameParts[0].slice(0, 2).toUpperCase()
            : (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        return {
          id: friend.id,
          name: friend.full_name,
          displayName,
          role: friend.company_role || 'Attendee',
          bio: friend.bio || '',
          initials,
          color: 'bg-[#2A3A68]',
          githubUrl: friend.github_url || '',
          linkedinUrl: friend.linkedin_url || '',
          email: friend.email,
          qrPayload: friend.qr_payload,
        };
      }
    } catch (err) {
      console.warn('Database friend details failed:', err);
    }
    return null;
  },
};
