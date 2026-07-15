import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Heading,
  Input,
  Link,
  Select,
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  loadDataset,
  searchSpins,
  type Dataset,
  type Spin,
} from "./lib/data";

const fmtTime = (at: number) =>
  new Date(at * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function App() {
  const [data, setData] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [station, setStation] = useState("all");
  const [results, setResults] = useState<Spin[]>([]);

  useEffect(() => {
    loadDataset().then(setData).catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    if (!data) return;
    let live = true;
    searchSpins(data.db, { term, station, limit: 250 }).then((r) => {
      if (live) setResults(r);
    });
    return () => {
      live = false;
    };
  }, [data, term, station]);

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const subtle = useColorModeValue("gray.600", "gray.400");

  if (error)
    return (
      <Container maxW="6xl" py={20}>
        <Alert status="error" rounded="md">
          <AlertIcon />
          Failed to load data: {error}. Run <code>&nbsp;pnpm data&nbsp;</code> first.
        </Alert>
      </Container>
    );

  if (!data)
    return (
      <Flex h="100vh" align="center" justify="center" direction="column" gap={4}>
        <Spinner size="xl" color="brand.400" thickness="3px" />
        <Text color={subtle}>building search index…</Text>
      </Flex>
    );

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
      <Header />
      <Container maxW="6xl" py={8}>
        <VStack align="stretch" spacing={8}>
          <Overview data={data} cardBg={cardBg} border={border} subtle={subtle} />
          <Box>
            <Heading size="md" mb={3}>
              Search spins
            </Heading>
            <HStack mb={4} spacing={3} flexWrap="wrap">
              <Input
                placeholder="artist or title…"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                maxW="sm"
                bg={cardBg}
                borderColor={border}
              />
              <Select
                value={station}
                onChange={(e) => setStation(e.target.value)}
                maxW="xs"
                bg={cardBg}
                borderColor={border}
              >
                <option value="all">All stations</option>
                {data.stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.market}
                  </option>
                ))}
              </Select>
              <Text color={subtle} fontSize="sm">
                {results.length} shown
              </Text>
            </HStack>
            <ResultsTable
              results={results}
              stations={data.stations}
              cardBg={cardBg}
              border={border}
              subtle={subtle}
            />
          </Box>
        </VStack>
      </Container>
      <Footer subtle={subtle} border={border} />
    </Box>
  );
}

function Header() {
  const { colorMode, toggleColorMode } = useColorMode();
  const border = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("white", "gray.800");
  return (
    <Box as="header" borderBottomWidth="1px" borderColor={border} bg={bg} position="sticky" top={0} zIndex={10}>
      <Container maxW="6xl" py={4}>
        <Flex align="center" justify="space-between" gap={4} flexWrap="wrap">
          <Box>
            <Heading size="md" letterSpacing="-0.02em">
              airmon
            </Heading>
            <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.400")}>
              open Canadian radio airplay — facts, not audio
            </Text>
          </Box>
          <HStack spacing={2}>
            <Badge colorScheme="blue" variant="subtle">CC0</Badge>
            <Badge colorScheme="green" variant="subtle">metadata-only</Badge>
            <Button size="sm" variant="ghost" onClick={toggleColorMode}>
              {colorMode === "light" ? "🌙" : "☀️"}
            </Button>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}

interface PanelProps {
  data: Dataset;
  cardBg: string;
  border: string;
  subtle: string;
}

function Overview({ data, cardBg, border, subtle }: PanelProps) {
  const { meta } = data;
  const windowDays = meta.dateRange
    ? (meta.dateRange[1] - meta.dateRange[0]) / 86400
    : 0;
  const rangeLabel = meta.dateRange
    ? `${fmtTime(meta.dateRange[0])} → ${fmtTime(meta.dateRange[1])}`
    : "—";

  return (
    <VStack align="stretch" spacing={4}>
      {windowDays < 7 && (
        <Alert status="info" rounded="md" fontSize="sm">
          <AlertIcon />
          Only {windowDays.toFixed(1)} days of data so far — early aggregates are a
          small sample and will settle as the log grows.
        </Alert>
      )}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <StatCard label="Total spins" value={meta.totalSpins.toLocaleString()} cardBg={cardBg} border={border} accent />
        <StatCard label="Stations" value={String(meta.stationCount)} cardBg={cardBg} border={border} />
        <StatCard label="Artists" value={meta.artistCount.toLocaleString()} cardBg={cardBg} border={border} />
        <StatCard label="Window" value={`${windowDays.toFixed(1)}d`} help={rangeLabel} cardBg={cardBg} border={border} />
      </SimpleGrid>
      <Text fontSize="xs" color={subtle}>
        Data generated {new Date(meta.generatedAt).toLocaleString()}. Every spin on
        every station is logged; nothing is filtered at collection.
      </Text>
    </VStack>
  );
}

function StatCard(props: {
  label: string;
  value: string;
  help?: string;
  cardBg: string;
  border: string;
  accent?: boolean;
}) {
  return (
    <Stat
      px={4}
      py={3}
      bg={props.cardBg}
      borderWidth="1px"
      borderColor={props.accent ? "brand.400" : props.border}
      rounded="lg"
    >
      <StatLabel fontSize="xs" color="gray.500">{props.label}</StatLabel>
      <StatNumber fontSize="2xl" color={props.accent ? "brand.400" : undefined}>
        {props.value}
      </StatNumber>
      {props.help && <StatHelpText fontSize="xs" mb={0}>{props.help}</StatHelpText>}
    </Stat>
  );
}

function ResultsTable({
  results,
  stations,
  cardBg,
  border,
  subtle,
}: {
  results: Spin[];
  stations: Dataset["stations"];
  cardBg: string;
  border: string;
  subtle: string;
}) {
  const nameOf = useMemo(() => {
    const m = new Map(stations.map((s) => [s.id, s.name]));
    return (id: string) => m.get(id) ?? id;
  }, [stations]);

  if (!results.length)
    return (
      <Box p={8} textAlign="center" color={subtle} borderWidth="1px" borderColor={border} rounded="lg" bg={cardBg}>
        No spins match.
      </Box>
    );

  return (
    <TableContainer bg={cardBg} borderWidth="1px" borderColor={border} rounded="lg">
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>Time</Th>
            <Th>Station</Th>
            <Th>Artist</Th>
            <Th>Title</Th>
            <Th>Src</Th>
          </Tr>
        </Thead>
        <Tbody>
          {results.map((sp, i) => (
            <Tr key={`${sp.s}-${sp.at}-${i}`}>
              <Td color={subtle} whiteSpace="nowrap">{fmtTime(sp.at)}</Td>
              <Td whiteSpace="nowrap">{nameOf(sp.s)}</Td>
              <Td fontWeight="medium">{sp.a}</Td>
              <Td>{sp.t}</Td>
              <Td>
                <Badge variant="subtle" colorScheme={sp.src === "triton" ? "blue" : "purple"}>
                  {sp.src}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

function Footer({ subtle, border }: { subtle: string; border: string }) {
  return (
    <Box borderTopWidth="1px" borderColor={border} mt={8}>
      <Container maxW="6xl" py={6}>
        <Text fontSize="xs" color={subtle}>
          airmon publishes open airplay <b>facts</b> — what played, when, on which
          station — so anyone can verify them independently. No audio is recorded or
          served, and the dataset takes no editorial position.{" "}
          <Link href="https://github.com/HudsonGraeme/airmon/tree/main/radio-airplay-monitor" color="brand.400" isExternal>
            Source
          </Link>
          .
        </Text>
      </Container>
    </Box>
  );
}
