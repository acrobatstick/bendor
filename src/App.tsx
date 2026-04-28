import { useCallback, useContext, useEffect, useRef } from "react"
import styled from "styled-components"
import Canvas from "./components/canvas"
import Exports from "./components/exports"
import LayerList from "./components/layerList"
import LayerSettings from "./components/layerSettings"
import Button from "./components/reusables/buttons"
import { H1, Link, Paragraph } from "./components/reusables/typography"
import UploadArea from "./components/uploadArea"
import { useStore } from "./hooks/useStore"
import { CanvasLoadingProvider } from "./providers/canvasloading/provider"
import { ShepherdTourContext } from "./providers/shepherd/shepherdContext"
import { PushTop } from "./styles/global"
import CanvasToolbar from "./components/canvasToolbar"
import { CanvasToolbarProvider } from "./hooks/useCanvasToolbar"
import { StoreActionType } from "./providers/store/reducer"
import { fileTypeFromBuffer } from "file-type"

function App() {
  const { state, dispatch } = useStore()
  const imageRef = useRef<HTMLInputElement>(null)

  const tour = useContext(ShepherdTourContext)

  const onImageChange = async () => {
    dispatch({ type: StoreActionType.ClearLayers })
    const files = imageRef.current?.files
    if (!files || files?.length === 0) {
      return
    }
    const file = files[0]
    const arrayBuf = await file.arrayBuffer()
    const blob = new Uint8Array(arrayBuf)
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target && event.target.result instanceof ArrayBuffer) {
        dispatch({
          type: StoreActionType.UpdateState,
          payload: { key: "imgBuf", value: event.target.result }
        })
      }
    }
    const ftresult = await fileTypeFromBuffer(blob)
    if (!ftresult) return
    dispatch({
      type: StoreActionType.UpdateState,
      payload: { key: "ftype", value: ftresult }
    })
    reader.readAsArrayBuffer(file)
  }

  const onClickInputButton = () => {
    imageRef.current?.click()
  }

  const hasImage = useCallback(() => {
    return state.imgBuf.byteLength > 0
  }, [state.imgBuf.byteLength])

  const hasActiveLayer = () => {
    return hasImage() && state.selectedLayerIdx !== -1
  }

  useEffect(() => {
    if (tour && hasImage()) {
      const boarded = localStorage.getItem("boarded")
      if (boarded) return
      tour.start()
    }
  }, [tour, hasImage])

  return (
    <CanvasLoadingProvider>
      <Layout columns={hasActiveLayer() ? 2 : 1}>
        <LeftColumn>
          <LogoContainer>
            <H1>bendor</H1>
            <Paragraph variant="secondary">
              Built as an open source project. Any contributions are welcome on{" "}
              <Link href="https://github.com/acrobatstick/bendor" target="_blank">
                GitHub.
              </Link>
            </Paragraph>
          </LogoContainer>
          <LayerList />
          {/* <GlobalConfiguration /> */}
          <Exports />
          {hasImage() && (
            <PushTop>
              <div style={{ padding: "24px" }}>
                <Button full variant={hasImage() ? "outline" : "primary"} onClick={onClickInputButton} type="button">
                  Change Image
                </Button>
              </div>
            </PushTop>
          )}
        </LeftColumn>
        {hasActiveLayer() && (
          <LeftColumn id="layerSettings">
            <LayerSettings />
          </LeftColumn>
        )}
        <RightColumn>
          {hasImage() && (
            <CanvasToolbarProvider>
              <Canvas />
              <CanvasToolbar />
            </CanvasToolbarProvider>
          )}
          <UploadArea visible={!hasImage()} ref={imageRef} onChange={onImageChange} />
        </RightColumn>
      </Layout>
    </CanvasLoadingProvider>
  )
}

const Layout = styled.div<{ columns?: number }>`
  display: grid;
  grid-template-columns: ${({ columns = 1 }) => (columns === 2 ? "330px 250px 1fr" : "330px 1fr")};
  min-height: 100vh;
  width: 100%;
  overflow-wrap: break-word;
  word-break: break-word;
  
  @media (max-width: 1280px) {
    grid-template-columns: 1fr;
    min-height: auto;
  }
`

const LeftColumn = styled.div`
  top: 0;
  left: 0;
  position: sticky;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-right: solid black 1px;
  border-right-style: dashed;
  box-sizing: border-box;

  height: 100vh;
  max-height: 100vh;

  @media (max-width: 1280px) {
    height: auto;
    max-width: auto;
    position: relative;
    height: auto;
    max-height: fit-content;
  }
`

const LogoContainer = styled.div`
  border-bottom: solid black 1px;
  border-bottom-style: dashed;
  padding: 24px;
`

const RightColumn = styled.div`
  position: relative;
  padding: 16px;
  overlow: hidden;
  height: 100vh;
`

export default App
