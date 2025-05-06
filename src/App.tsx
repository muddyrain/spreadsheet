import Spreadsheet from "./components/spreadsheet";

function App() {
  return (
    <>
      <Spreadsheet
        config={{
          rows: 30,
          cols: 4,
        }}
      />
    </>
  );
}

export default App;
