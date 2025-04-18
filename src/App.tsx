import Spreadsheet from "./components";

function App() {
  return (
    <>
      <Spreadsheet onChange={data => {
        console.log(data);
      }} />
    </>
  );
}

export default App;
