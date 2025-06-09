import Spreadsheet from "./components/spreadsheet";
function App() {
  return (
    <>
      <Spreadsheet
        config={{
          rows: 7600,
        }}
      />
    </>
  );
}

export default App;
