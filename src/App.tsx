import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import {
  BaseDirectory,
  createDir,
  readDir,
  readTextFile,
  removeFile,
  writeFile,
} from "@tauri-apps/api/fs";

const createDataFolder = async () => {
  try {
    await createDir("data", {
      dir: BaseDirectory.App,
      recursive: true,
    });
  } catch (e) {
    console.error(e);
  }
};

const createDataFile = async (
  dir: BaseDirectory,
  contents: string,
  serialGroupName: string
) => {
  try {
    await writeFile(
      { path: `./data/${serialGroupName}.json`, contents },
      { dir }
    );
  } catch (e) {
    console.log(e);
  }
};

const getSerialGroups = async () => {
  try {
    const groups = await readDir("./data", { dir: BaseDirectory.App });
    console.log(groups);
    return groups;
  } catch (e) {
    console.log(e);
  }
};

const readFileAndParse = async (
  path: string
): Promise<string[] | undefined> => {
  try {
    const unparsedData = await readTextFile(path);
    return JSON.parse(unparsedData);
  } catch (e) {
    console.log(e);
  }
};

const getParsedSerialGroups = async (): Promise<SerialGroup[] | undefined> => {
  await createDataFolder();

  const serialGroups = await getSerialGroups();

  try {
    const groups =
      serialGroups &&
      serialGroups.map(async (group: any) => {
        const parsedFile = await readFileAndParse(group.path);
        return {
          name: group.name,
          serials: parsedFile || [],
        };
      });
    return groups && (await Promise.all(groups));
  } catch (e) {
    console.log(e);
  }
};

interface SerialGroup {
  name: string;
  serials: string[];
}

const deleteFile = async (path: string) => {
  try {
    await removeFile(`./data/${path}`, { dir: BaseDirectory.App });
  } catch (e) {
    console.log(e);
  }
};

function App() {
  const [serialCount, setSerialCount] = useState<number>(10);
  const [serialGroupName, setSerialGroupName] = useState<string>("");
  const [serialGroups, setSerialGroups] = useState<SerialGroup[]>([]);

  useEffect(() => {
    getParsedSerialGroups().then((groups) => {
      setSerialGroups(groups || []);
    });
  }, []);

  async function generateSerials() {
    if (
      serialGroups.find(
        (group) =>
          group.name === `${serialGroupName}.json}` ||
          group.name === serialGroupName
      )
    ) {
      alert("Serial group name already exists");
      return;
    }
    const serials: string[] = await invoke("generate_serials", {
      count: serialCount,
    });

    console.log(serials);

    await createDataFile(
      BaseDirectory.App,
      JSON.stringify(serials),
      serialGroupName
    );
    setSerialGroups([...serialGroups, { serials, name: serialGroupName }]);
  }

  async function deleteSerialGroup(serialGroupName: string) {
    await deleteFile(`${serialGroupName}.json`);
    setSerialGroups(
      serialGroups.filter(
        (group) =>
          group.name !== `${serialGroupName}.json` &&
          group.name !== serialGroupName
      )
    );
  }

  return (
    <div className="flex flex-row gap-4 overflow-hidden">
      <div className="flex-1/4 bg-slate-800 h-screen p-4">
        <h1 className="text-2xl font-bold text-green-100 mb-4">
          Serial Generator
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generateSerials();
          }}
          className="mb-4"
        >
          <div className="flex gap-4 mb-4 flex-col">
            <input
              type="text"
              className="rounded p-2 text-black"
              onChange={(e) => setSerialGroupName(e.target.value)}
              value={serialGroupName}
              placeholder="Serial Group Name"
            />
            <input
              type="number"
              className="rounded p-2 text-black"
              onChange={(e) => setSerialCount(Number(e.target.value))}
              value={serialCount}
              placeholder="Serial Count"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-green-500 p-2 hover:bg-green-600 text-white"
          >
            Generate Serials
          </button>
        </form>
      </div>
      <div className="flex-auto pt-4 overflow-x-scroll">
        <h1 className="text-2xl font-bold text-green-100 mb-4">Serials</h1>
        {serialGroups && (
          <div className="flex gap-4 mb-4">
            {serialGroups.map((serialGroup: SerialGroup) => (
              <div key={serialGroup.name}>
                <h2 className="text-lg font-bold text-green-100 mb-4">
                  {serialGroup.name}
                </h2>
                <button
                  onClick={() => deleteSerialGroup(serialGroup.name)}
                  className="rounded bg-red-500 p-2 hover:bg-red-600 text-white mb-4"
                >
                  Delete
                </button>
                <ul className="font-mono bg-slate-700 text-green-200 p-8 rounded">
                  {serialGroup.serials.map((serial) => (
                    <li key={serial}>{serial}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
