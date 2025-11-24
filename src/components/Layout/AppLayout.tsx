import { Box, Flex } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Flex height="100vh" bg="#fbfbfb">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <Flex flexDirection="column" flex="1" overflow="hidden">
        {/* Top Header */}
        <TopHeader />

        {/* Page content */}
        <Box flex="1" overflowY="auto">
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
