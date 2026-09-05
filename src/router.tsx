import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false, // Prevent refetching when switching back to browser tab
        staleTime: 5 * 60 * 1000,    // Cache query results for 5 minutes (data remains fresh)
        gcTime: 10 * 60 * 1000,      // Keep unused data in cache memory for 10 minutes
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
