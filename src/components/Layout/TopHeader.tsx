import { Box, Flex, IconButton, Text, Button } from '@chakra-ui/react';
import { Menu } from '@chakra-ui/react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export function TopHeader() {
  return (
    <Flex
      height="60px"
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.200"
      px={4}
      align="center"
      justify="flex-end"
      flexShrink={0}
    >
      {/* Right side: Help | SiteID Selector | User Avatar */}
      <Flex align="center" gap={2}>
        {/* Help icon */}
        <IconButton
          aria-label="Help"
          variant="ghost"
          size="sm"
        >
          <HelpOutlineIcon />
        </IconButton>

        {/* Site selector */}
        <Menu.Root positioning={{ placement: 'bottom-end', strategy: 'fixed' }}>
          <Menu.Trigger asChild>
            <Button variant="ghost" size="sm">
              <Flex align="center" gap={2}>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    SITE ID: 000
                  </Text>
                  <Text fontSize="sm" fontWeight="medium">
                    DEMO@RELAY42.COM
                  </Text>
                </Box>
                <ExpandMoreIcon fontSize="small" />
              </Flex>
            </Button>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item value="site1">Site 1</Menu.Item>
              <Menu.Item value="site2">Site 2</Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>

        {/* User menu */}
        <Menu.Root positioning={{ placement: 'bottom-end', strategy: 'fixed' }}>
          <Menu.Trigger asChild>
            <IconButton
              aria-label="User menu"
              variant="ghost"
              size="sm"
            >
              <AccountCircleIcon />
            </IconButton>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item value="profile">Profile</Menu.Item>
              <Menu.Item value="settings">Settings</Menu.Item>
              <Menu.Item value="logout">Logout</Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </Flex>
    </Flex>
  );
}
