import { useState, ChangeEvent, useEffect } from "react";
import { debounce } from "lodash";
import { exportToQuizlet } from "./export-to-quizlet";
import {
  Link,
  Text,
  Box,
  Heading,
  InputGroup,
  InputRightElement,
  Input,
  Flex,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  CloseButton,
} from "@chakra-ui/react";
import "./App.css";

function App() {
  const [apiKey, setApiKey] = useState("");
  const [dict, setDict] = useState({});
  const [show, setShow] = useState(false);

  useEffect(() => {
    const getApiKey = async () => {
      const value = (await chrome.storage.sync.get("openAiApiKey"))[
        "openAiApiKey"
      ];
      setApiKey(value);
    };
    getApiKey();

    const getDict = async () => {
      const value = await chrome.storage.sync.get(null);
      delete value.openAiApiKey;
      setDict(value);
    };
    getDict();
  }, []);

  const handleApiKeyChangeDebounced = debounce((value: string) => {
    chrome.storage.sync.set({ openAiApiKey: value });
  }, 500);

  const handleApiKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setApiKey(value);
    handleApiKeyChangeDebounced(value);
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(exportToQuizlet(dict));
  };

  const handleDeleteClick = async () => {
    try {
      const apiKey = (await chrome.storage.sync.get("openAiApiKey"))[
        "openAiApiKey"
      ];
      await chrome.storage.sync.clear();
      await chrome.storage.sync.set({ openAiApiKey: apiKey });
      setDict({});
    } catch (error) {
      console.log("Failed to delete dictionary: ", error);
    }
  };

  const handleHideClick = () => {
    setShow(!show);
  };

  const deleteWord = async (word: string) => {
    await chrome.storage.sync.remove(word);
    const updatedDict: Record<string, any> = { ...dict };
    delete updatedDict[word];
    setDict(updatedDict);
  };

  return (
    <div className="App">
      <Box m={4}>
        <Heading>言語学習サポートAI</Heading>
        <Link href="https://github.com/taro-ishihara/learning-support-ai#readme" isExternal>
          使い方（外部サイト）
        </Link>
        <InputGroup mt={2} size="md">
          <Input
            pr="4.5rem"
            type={show ? "text" : "password"}
            placeholder="OpenAI Secret API key"
            onChange={handleApiKeyChange}
            value={apiKey}
          />
          <InputRightElement width="4.5rem">
            <Button h="1.75rem" size="sm" onClick={handleHideClick}>
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
        <TableContainer mt={4}>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th></Th>
                <Th>単語・表現</Th>
                <Th>説明</Th>
              </Tr>
            </Thead>
            <Tbody>
              {Object.entries(dict).map(([key, value]) => (
                <Tr key={key}>
                  <Td>
                    <CloseButton onClick={() => deleteWord(key)} />
                  </Td>
                  <Td>{key}</Td>
                  <Td maxWidth="360px">
                    <Text>{String(value)}</Text>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
        <ul></ul>
        <Flex mt={2}>
          <Button
            colorScheme="teal"
            variant="solid"
            mr={4}
            onClick={handleCopyClick}
          >
            Quizlet形式でコピー
          </Button>
          <Button
            colorScheme="red"
            variant="outline"
            onClick={handleDeleteClick}
          >
            辞書を全て削除
          </Button>
        </Flex>
      </Box>
    </div>
  );
}

export default App;
