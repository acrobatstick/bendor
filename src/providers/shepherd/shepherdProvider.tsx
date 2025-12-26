import { offset } from "@floating-ui/dom"
import { type ReactNode, useMemo } from "react"
import Shepherd, { type StepOptions } from "shepherd.js"
import { ShepherdTourContext } from "./shepherdContext"

const waitForElement = (selector: string): Promise<Element> => {
  return new Promise((resolve) => {
    const element = document.querySelector(selector)
    if (element) {
      resolve(element)
      return
    }
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector)
      if (element) {
        observer.disconnect()
        resolve(element)
      }
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  })
}

export const ShepherdProvider = ({ children }: { children: ReactNode }) => {
  const isMobile = window.innerWidth < 1280
  const tour = useMemo(
    () =>
      new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          classes: "onboarding",
          cancelIcon: {
            enabled: true
          },
          floatingUIOptions: {
            middleware: [offset(40)]
          }
        },
        exitOnEsc: true
      }),
    []
  )

  const steps: Array<StepOptions> = [
    {
      id: "welcome",
      title: "Welcome!",
      text: "Let's create some amazing glitch art! This quick tour will show you how to transform your images.",
      buttons: [
        {
          text: "Skip",
          action: tour.cancel,
          secondary: true
        },
        {
          text: "Start Tour",
          action: tour.next
        }
      ],
      floatingUIOptions: {
        middleware: [offset(0)]
      }
    },
    {
      id: "addLayer",
      title: "Step 1: Add Layer",
      text: "Start by clicking here to add a new layer. Each layer can have different glitch effects applied to it.",
      attachTo: {
        element: "#addNewLayer",
        on: isMobile ? "bottom" : "right"
      },
      scrollTo: { behavior: "smooth", block: "center" }
    },
    {
      id: "chooseEffect",
      title: "Step 2: Choose Your Effect",
      text: "Browse through various glitch filters here. Try different effects to see what works best for your image!",
      attachTo: {
        element: "#filterList",
        on: "bottom"
      },
      beforeShowPromise: () => {
        return waitForElement("#filterList")
      },
      scrollTo: { behavior: "smooth", block: "center" }
    },
    {
      id: "selectArea",
      title: "Step 3: Select Your Area",
      text: "Click and drag to outline the region where you want to apply effect.",
      attachTo: {
        element: "#imageCanvas",
        on: "bottom"
      },
      beforeShowPromise: () => {
        return waitForElement("#imageCanvas")
      },
      scrollTo: { behavior: "smooth", block: "center" }
    },
    {
      id: "selectAllArea",
      title: "Step 4: Select the entire image",
      text: "Click once on the image to select the entire image.",
      attachTo: {
        element: "#imageCanvas",
        on: "bottom"
      },
      scrollTo: { behavior: "smooth", block: "center" }
    },
    {
      id: "adjustFilter",
      title: "Step 5: Adjust Filter",
      text: "You can adjust how the filter looks here.",
      attachTo: {
        element: "#layerSettings",
        on: isMobile ? "top" : "right"
      },
      buttons: [
        {
          text: "Next",
          action: tour.next
        }
      ],
      scrollTo: { behavior: "smooth", block: "center" }
    },
    {
      id: "export",
      title: "Step 6: Export Your Creation",
      text: "Happy with your glitch art? export it as an Image or GIF right here and share your masterpiece!",
      attachTo: {
        element: "#exportContainer",
        on: isMobile ? "top" : "right"
      },
      beforeShowPromise: () => {
        return waitForElement("#exportContainer")
      },
      buttons: [
        {
          text: "Finish",
          action: tour.complete
        }
      ],
      scrollTo: { behavior: "smooth", block: "center" }
    }
  ]

  tour.addSteps(steps)

  tour.on("complete", () => {
    localStorage.setItem("boarded", "1")
  })

  tour.on("cancel", () => {
    localStorage.setItem("boarded", "1")
  })

  return <ShepherdTourContext.Provider value={tour}>{children}</ShepherdTourContext.Provider>
}
