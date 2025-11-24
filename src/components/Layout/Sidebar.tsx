import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import GroupsIcon from '@mui/icons-material/Groups';
import TimelineIcon from '@mui/icons-material/Timeline';
import StorageIcon from '@mui/icons-material/Storage';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CampaignIcon from '@mui/icons-material/Campaign';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to?: string;
  badge?: string;
  active?: boolean;
}

function NavItem({ icon, label, to = '#', badge, active = false }: NavItemProps) {
  return (
    <Link to={to} style={{ textDecoration: 'none', width: '100%' }}>
      <Flex
        align="center"
        gap={3}
        px={4}
        py={2.5}
        cursor="pointer"
        bg={active ? 'purple.50' : 'transparent'}
        color={active ? 'purple.700' : 'gray.700'}
        borderLeft={active ? '3px solid' : '3px solid transparent'}
        borderColor={active ? 'purple.600' : 'transparent'}
        _hover={{ bg: active ? 'purple.50' : 'gray.50' }}
        transition="all 0.2s"
      >
        <Box fontSize="20px" display="flex" alignItems="center">
          {icon}
        </Box>
        <Text fontSize="sm" fontWeight={active ? 'semibold' : 'normal'} flex="1">
          {label}
        </Text>
        {badge && (
          <Text fontSize="xs" color="gray.500">
            {badge}
          </Text>
        )}
      </Flex>
    </Link>
  );
}

interface NavSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function NavSection({ title, children, defaultExpanded = false }: NavSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Box>
      <Flex
        align="center"
        gap={2}
        px={4}
        py={2}
        cursor="pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        _hover={{ bg: 'gray.50' }}
        transition="background 0.2s"
      >
        <Box fontSize="16px" display="flex" alignItems="center" color="gray.500">
          {isExpanded ? (
            <ExpandMoreIcon fontSize="inherit" />
          ) : (
            <ChevronRightIcon fontSize="inherit" />
          )}
        </Box>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="gray.500"
          textTransform="uppercase"
          letterSpacing="wide"
          flex="1"
        >
          {title}
        </Text>
      </Flex>
      {isExpanded && (
        <VStack gap={0.5} align="stretch">
          {children}
        </VStack>
      )}
    </Box>
  );
}

export function Sidebar() {
  const location = useLocation();
  const isAudiences = location.pathname.startsWith('/audiences');

  return (
    <Box
      width="240px"
      bg="white"
      borderRight="1px solid"
      borderColor="gray.200"
      flexShrink={0}
      display="flex"
      flexDirection="column"
    >
      {/* Logo */}
      <Flex align="center" px={4} py={4} borderBottom="1px solid" borderColor="gray.200">
        <Text fontSize="lg" fontWeight="bold" color="purple.600">
          Relay42
        </Text>
      </Flex>

      {/* Navigation */}
      <VStack gap={4} align="stretch" py={4} flex="1" overflowY="auto">
        {/* Dashboard */}
        <VStack gap={0.5} align="stretch">
          <NavItem icon={<DashboardIcon fontSize="small" />} label="Dashboard" to="/" />
        </VStack>

        {/* Orchestrate section - expanded by default */}
        <NavSection title="Orchestrate" defaultExpanded={true}>
          <NavItem icon={<GroupsIcon fontSize="small" />} label="Audiences" to="/audiences" active={isAudiences} />
          <NavItem icon={<TimelineIcon fontSize="small" />} label="Journeys" />
        </NavSection>

        {/* Connect section - collapsed by default */}
        <NavSection title="Connect">
          <NavItem icon={<StorageIcon fontSize="small" />} label="Data sources" />
          <NavItem icon={<LocalOfferIcon fontSize="small" />} label="Tags" />
          <NavItem icon={<SendIcon fontSize="small" />} label="Data destinations" />
        </NavSection>

        {/* Manage section - collapsed by default */}
        <NavSection title="Manage">
          <NavItem icon={<PersonIcon fontSize="small" />} label="Customer profiles" />
          <NavItem icon={<AccountTreeIcon fontSize="small" />} label="Data flow rules" />
          <NavItem icon={<SmartToyIcon fontSize="small" />} label="AI models" />
          <NavItem icon={<CampaignIcon fontSize="small" />} label="Campaign content" />
        </NavSection>

        {/* Spacer to push Get started to bottom */}
        <Box flex="1" />

        {/* Get started at bottom */}
        <VStack gap={0.5} align="stretch">
          <NavItem icon={<RocketLaunchIcon fontSize="small" />} label="Get started" badge="60%" />
        </VStack>
      </VStack>
    </Box>
  );
}
