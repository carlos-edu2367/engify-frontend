import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";
import { teamsService } from "@/services/teams.service";
import type { InviteRequest } from "@/types/team.types";
import type { UpdateUserRequest } from "@/types/user.types";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.list(),
  });
}

export function useUpdateMe() {
  return useMutation({
    mutationFn: (data: UpdateUserRequest) => usersService.updateMe(data),
  });
}

export function useInviteMember() {
  return useMutation({
    mutationFn: (data: InviteRequest) => teamsService.invite(data),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => usersService.delete(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}
