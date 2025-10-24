"use client";

import type { Instance, List, ViewState } from "@nutrient-sdk/viewer";
import { useCallback, useEffect, useRef, useState } from "react";

type EventHandler = (event: Event) => void;

// Enhanced version of closestByClass that logs the element structure for debugging
function closestByClass(
	el: Element | Node | null,
	className: string,
): Element | null {
	if (!el) return null;

	// Check if element has classList and the target class
	if (
		el instanceof Element &&
		el.classList &&
		el.classList.contains(className)
	) {
		return el as Element;
	}

	// Also check if the className is in the string (alternative method)
	if (
		el instanceof Element &&
		el.className &&
		typeof el.className === "string" &&
		el.className.includes(className)
	) {
		return el as Element;
	}

	// Recursively check parent
	return el.parentNode ? closestByClass(el.parentNode, className) : null;
}

interface ViewerProps {
	formCreatorMode: boolean;
}

export default function Viewer({ formCreatorMode }: ViewerProps) {
	const containerRef = useRef(null);
	const [_isViewerReady, setIsViewerReady] = useState(false);
	const viewerInstanceRef = useRef<Instance | null>(null);
	const eventHandlersRef = useRef<{
		dragover: EventHandler;
		drop: EventHandler;
	} | null>(null);

	// Helper function to clean up drag and drop handlers
	const cleanupDragAndDrop = useCallback((instance: Instance) => {
		if (instance?.contentDocument && eventHandlersRef.current) {
			const { dragover, drop } = eventHandlersRef.current;
			instance.contentDocument.removeEventListener("dragover", dragover);
			instance.contentDocument.removeEventListener("drop", drop);
			eventHandlersRef.current = null;
		}
	}, []);

	// Helper function to set up drag and drop handlers
	const setupDragAndDrop = useCallback(
		(instance: Instance, enabled: boolean) => {
			if (!window.NutrientViewer) return;
			const { NutrientViewer } = window;
			let _isDragAndDropSupported = false;
			let label = "";

			// Dragover handler
			const dragoverHandler = (event: Event): void => {
				// Only allow drag over when Form Creator mode is enabled
				if (!enabled) {
					return;
				}

				const dragEvent = event as DragEvent;
				_isDragAndDropSupported = true;

				// Try to find the page element using various methods
				let pageElement = null;

				// Method 1: Check if target or parent has the expected class
				pageElement = closestByClass(
					dragEvent.target as Element,
					"PSPDFKit-Page",
				);

				// Method 2: If that doesn't work, check for alternative class names
				if (!pageElement) {
					pageElement = closestByClass(
						dragEvent.target as Element,
						"pspdfkit-page",
					);
				}

				// Method 3: As a fallback, look for any element with 'page' in the class name
				if (!pageElement) {
					const target = dragEvent.target as Element;
					if (target.classList) {
						const allClasses = Array.from(target.classList);
						const pageClasses = allClasses.filter((cls) =>
							cls.toLowerCase().includes("page"),
						);
						if (pageClasses.length > 0) {
							pageElement = target;
						}
					}
				}

				// Allow drop operation
				if (pageElement) {
					event.preventDefault();
				}
			};

			// Drop handler
			const dropHandler = async (event: Event) => {
				// Only allow drop when Form Creator mode is enabled
				if (!enabled) {
					return;
				}

				const dragEvent = event as DragEvent;
				// Always prevent default and stop propagation
				event.preventDefault();
				event.stopPropagation();

				console.log("Drop event occurred");
				label = dragEvent.dataTransfer?.getData("text") || "";
				console.log("Annotation type:", label);

				// Try multiple methods to identify the page element
				let pageElement = closestByClass(
					dragEvent.target as Element,
					"PSPDFKit-Page",
				);
				if (!pageElement) {
					pageElement = closestByClass(
						dragEvent.target as Element,
						"pspdfkit-page",
					);
				}

				// Fallback method - find any element with page in the class name
				if (!pageElement) {
					const target = dragEvent.target as Element;
					if (target.classList) {
						const allClasses = Array.from(target.classList);
						const pageClasses = allClasses.filter((cls) =>
							cls.toLowerCase().includes("page"),
						);
						if (pageClasses.length > 0) {
							pageElement = target;
						}
					}
				}

				// If we still can't find a page element, try to get the page index via coordinate conversion
				let pageIndex = 0;
				if (pageElement) {
					// Extract page index from the element's dataset or other attributes
					pageIndex = parseInt(
						(pageElement as HTMLElement).dataset.pageIndex || "0",
						10,
					);
					console.log("Page element found, page index:", pageIndex);
				} else {
					// Fallback to page 0 if we can't determine the page
					console.warn("No page element found, defaulting to page 0");
				}

				try {
					// Different configurations based on annotation type
					let boundingBoxDimensions = { height: 55, width: 225 };

					// Common calculations for positioning
					// Use fixed offset so all field sizes align consistently
					const horizontalOffset = 100; // Fixed pixel offset from cursor
					const clientRect = new NutrientViewer.Geometry.Rect({
						left: dragEvent.clientX - horizontalOffset,
						top: dragEvent.clientY - boundingBoxDimensions.height / 2,
						...boundingBoxDimensions,
					});

					const pageRect = instance.transformContentClientToPageSpace(
						clientRect,
						pageIndex,
					);

					// Generate a unique ID that will be used for both the widget and form field
					const uniqueId = NutrientViewer.generateInstantId();
					const formFieldName = `${label.toLowerCase()}-${uniqueId}`;

					// Create different annotation types based on the label
					switch (label) {
						case "Signature": {
							// Create widget annotation
							const widget = new NutrientViewer.Annotations.WidgetAnnotation({
								boundingBox: pageRect,
								formFieldName: formFieldName,
								id: uniqueId,
								pageIndex,
								name: "Signature",
							});

							// Create form field directly referencing the widget
							const formField =
								new NutrientViewer.FormFields.SignatureFormField({
									annotationIds: new (
										NutrientViewer.Immutable.List as unknown as new (
											items: string[],
										) => List<string>
									)([uniqueId]),
									name: formFieldName, // Make sure this matches the formFieldName in the widget
								});

							// Create both objects in one go
							await instance.create([widget, formField]);
							console.log("Successfully created Signature annotation");
							break;
						}

						case "DateSigned": {
							// Set smaller size for date field
							boundingBoxDimensions = { height: 55, width: 225 };

							// Recalculate with new dimensions using slightly adjusted offset
							const dateClientRect = new NutrientViewer.Geometry.Rect({
								left: dragEvent.clientX - horizontalOffset - 10,
								top: dragEvent.clientY - boundingBoxDimensions.height / 2,
								...boundingBoxDimensions,
							});
							const datePageRect = instance.transformContentClientToPageSpace(
								dateClientRect,
								pageIndex,
							);

							// Generate a unique ID for date field
							const dateUniqueId = NutrientViewer.generateInstantId();
							const dateFormFieldName = `date-${dateUniqueId}`;

							const widget = new NutrientViewer.Annotations.WidgetAnnotation({
								boundingBox: datePageRect,
								formFieldName: dateFormFieldName,
								id: dateUniqueId,
								pageIndex,
								name: "Date Signed",
							});

							const formField = new NutrientViewer.FormFields.TextFormField({
								annotationIds: new (
									NutrientViewer.Immutable.List as unknown as new (
										items: string[],
									) => List<string>
								)([dateUniqueId]),
								name: dateFormFieldName,
								// You can set a default date value if needed
								value: "TBD: Date Signed",
							});

							// Create both objects in one go
							await instance.create([widget, formField]);
							console.log("Successfully created Date annotation");
							break;
						}

						case "Initials": {
							// Smaller size for initials
							boundingBoxDimensions = { height: 50, width: 50 };

							// Recalculate with new dimensions using slightly adjusted offset
							const initialsClientRect = new NutrientViewer.Geometry.Rect({
								left: dragEvent.clientX - horizontalOffset - 15,
								top: dragEvent.clientY - boundingBoxDimensions.height / 2,
								...boundingBoxDimensions,
							});
							const initialsPageRect =
								instance.transformContentClientToPageSpace(
									initialsClientRect,
									pageIndex,
								);

							// Generate a unique ID for initials field
							const initialsUniqueId = NutrientViewer.generateInstantId();
							const initialsFormFieldName = `initials-${initialsUniqueId}`;

							const widget = new NutrientViewer.Annotations.WidgetAnnotation({
								boundingBox: initialsPageRect,
								formFieldName: initialsFormFieldName,
								id: initialsUniqueId,
								pageIndex,
								name: "Initials",
							});

							const formField =
								new NutrientViewer.FormFields.SignatureFormField({
									annotationIds: new (
										NutrientViewer.Immutable.List as unknown as new (
											items: string[],
										) => List<string>
									)([initialsUniqueId]),
									name: initialsFormFieldName,
								});

							// Create both objects in one go
							await instance.create([widget, formField]);
							console.log("Successfully created Initials annotation");
							break;
						}

						default: {
							// Handle unknown annotation types
							console.log("Unknown annotation type:", label);

							// Generate a default ID
							const defaultUniqueId = NutrientViewer.generateInstantId();
							const defaultFormFieldName = `annotation-${defaultUniqueId}`;

							const widget = new NutrientViewer.Annotations.WidgetAnnotation({
								boundingBox: pageRect,
								formFieldName: defaultFormFieldName,
								id: defaultUniqueId,
								pageIndex,
								name: label || "Annotation",
							});

							const formField =
								new NutrientViewer.FormFields.SignatureFormField({
									annotationIds: new (
										NutrientViewer.Immutable.List as unknown as new (
											items: string[],
										) => List<string>
									)([defaultUniqueId]),
									name: defaultFormFieldName,
								});

							// Create both objects in one go
							await instance.create([widget, formField]);
							console.log("Successfully created default annotation");
							break;
						}
					}
				} catch (error) {
					console.error("Error creating annotation:", error);
				}

				return false;
			};

			// Add event listeners
			if (instance?.contentDocument) {
				instance.contentDocument.addEventListener("dragover", dragoverHandler);
				instance.contentDocument.addEventListener("drop", dropHandler);

				// Store handlers for later cleanup
				eventHandlersRef.current = {
					dragover: dragoverHandler,
					drop: dropHandler,
				};
			}
		},
		[],
	);

	// Update interaction mode when formCreatorMode changes
	useEffect(() => {
		const instance = viewerInstanceRef.current;
		if (instance && window.NutrientViewer) {
			const interactionMode = formCreatorMode
				? window.NutrientViewer.InteractionMode.FORM_CREATOR
				: null;

			console.log(
				`Setting interaction mode to: ${formCreatorMode ? "FORM_CREATOR" : "null"}`,
			);

			instance.setViewState((viewState: ViewState) =>
				interactionMode
					? viewState.set("interactionMode", interactionMode)
					: viewState.set("interactionMode", null),
			);
		}
	}, [formCreatorMode]);

	// Initialize the viewer
	useEffect(() => {
		const container = containerRef.current;
		let viewerInstance: Instance | null = null;

		// Only initialize if not already done
		if (container && !viewerInstanceRef.current && window.NutrientViewer) {
			const { NutrientViewer } = window;

			NutrientViewer.load({
				container,
				document: "https://www.nutrient.io/downloads/pspdfkit-web-demo.pdf",
				baseUrl: "https://cdn.cloud.pspdfkit.com/pspdfkit-web@1.2.0/",
			})
				.then((instance: Instance) => {
					viewerInstance = instance;
					viewerInstanceRef.current = instance;
					setIsViewerReady(true);
					console.log("Viewer is ready");

					// Set initial interaction mode based on formCreatorMode prop
					const interactionMode = formCreatorMode
						? NutrientViewer.InteractionMode.FORM_CREATOR
						: null;

					instance.setViewState((viewState: ViewState) =>
						interactionMode
							? viewState.set("interactionMode", interactionMode)
							: viewState.set("interactionMode", null),
					);

					// Set up drag and drop handlers
					setupDragAndDrop(instance, formCreatorMode);
				})
				.catch((error: Error) => {
					console.error("Error loading viewer:", error);
				});
		}

		return () => {
			if (viewerInstance) {
				console.log("Unloading viewer");
				cleanupDragAndDrop(viewerInstance);
				window.NutrientViewer?.unload(container);
				viewerInstanceRef.current = null;
			}
		};
	}, [
		cleanupDragAndDrop,
		formCreatorMode, // Set up drag and drop handlers
		setupDragAndDrop,
	]); // Empty dependency array as this should only run once on mount

	// Setup drag and drop handlers whenever formCreatorMode changes
	useEffect(() => {
		const instance = viewerInstanceRef.current;
		if (instance) {
			// Clean up existing handlers first
			cleanupDragAndDrop(instance);

			// Set up new handlers with current formCreatorMode
			setupDragAndDrop(instance, formCreatorMode);
		}
	}, [
		formCreatorMode, // Clean up existing handlers first
		cleanupDragAndDrop, // Set up new handlers with current formCreatorMode
		setupDragAndDrop,
	]);

	// You must set the container height and width
	return <div ref={containerRef} style={{ height: "100vh", width: "100%" }} />;
}
