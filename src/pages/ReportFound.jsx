import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import "./Report.css";

function ReportFound() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [date, setDate] = useState("");

  // =============================
  // FORMAT DATE AS DD/MM/YYYY
  // =============================

  const handleDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length > 8) {
      value = value.slice(0, 8);
    }

    if (value.length >= 5) {
      value =
        value.slice(0, 2) +
        "/" +
        value.slice(2, 4) +
        "/" +
        value.slice(4);
    } else if (value.length >= 3) {
      value =
        value.slice(0, 2) +
        "/" +
        value.slice(2);
    }

    setDate(value);
  };

  // =============================
  // CONVERT DATE FOR DATABASE
  // =============================

  const convertDateForDatabase = (dateValue) => {
    const parts = dateValue.split("/");

    if (parts.length !== 3) {
      return null;
    }

    const [day, month, year] = parts;

    return `${year}-${month}-${day}`;
  };

  // =============================
  // COMPRESS IMAGE
  // =============================

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(
          new Error("Please select a valid image.")
        );

        return;
      }

      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();

        img.src = event.target.result;

        img.onload = () => {
          const canvas =
            document.createElement("canvas");

          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round(
                height * (MAX_WIDTH / width)
              );

              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round(
                width * (MAX_HEIGHT / height)
              );

              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx =
            canvas.getContext("2d");

          ctx.drawImage(
            img,
            0,
            0,
            width,
            height
          );

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(
                  new Error(
                    "Could not compress image."
                  )
                );

                return;
              }

              const compressedFile = new File(
                [blob],
                `${Date.now()}.jpg`,
                {
                  type: "image/jpeg",
                }
              );

              resolve(compressedFile);
            },
            "image/jpeg",
            0.75
          );
        };

        img.onerror = () => {
          reject(
            new Error("Could not read image.")
          );
        };
      };

      reader.onerror = () => {
        reject(
          new Error("Could not read image.")
        );
      };
    });
  };

  // =============================
  // SUBMIT REPORT
  // =============================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);

    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;

    if (!dateRegex.test(date)) {
      alert(
        "Please enter the date in DD/MM/YYYY format."
      );

      setLoading(false);

      return;
    }

    // GET CURRENT USER

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);

      alert(
        "You must be logged in to submit a report."
      );

      return;
    }

    const formData = new FormData(event.target);

    let imageUrl = null;

    // =============================
    // UPLOAD IMAGE
    // =============================

    if (image) {
      try {
        const compressedImage =
          await compressImage(image);

        const fileName =
          `${user.id}/${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.jpg`;

        const { error: uploadError } =
          await supabase.storage
            .from("report-images")
            .upload(fileName, compressedImage, {
              cacheControl: "3600",
              upsert: false,
              contentType: "image/jpeg",
            });

        if (uploadError) {
          setLoading(false);

          alert(
            "Error uploading image: " +
              uploadError.message
          );

          return;
        }

        const { data } = supabase.storage
          .from("report-images")
          .getPublicUrl(fileName);

        imageUrl = data.publicUrl;
      } catch (error) {
        console.error(error);

        setLoading(false);

        alert(
          "Error processing image: " +
            error.message
        );

        return;
      }
    }

    // =============================
    // SAVE REPORT
    // =============================

    const { error } = await supabase
      .from("reports")
      .insert([
        {
          item_name:
            formData.get("item_name"),

          description:
            formData.get("description"),

          location:
            formData.get("location"),

          report_date:
            convertDateForDatabase(date),

          image_url: imageUrl,

          type: "Found",

          status: "Open",

          user_id: user.id,
        },
      ]);

    setLoading(false);

    if (error) {
      console.error(error);

      alert(
        "Error submitting report: " +
          error.message
      );

      return;
    }

    setSubmitted(true);
    setImage(null);
    setDate("");

    event.target.reset();
  };

  return (
    <div className="report-page">
      <div className="report-form-card found-report-card">

        {!submitted ? (
          <>
            <div className="report-header">

              <div className="report-icon">
                🟢
              </div>

              <h1>
                Report Found Item
              </h1>

              <p>
                Tell us about the item you found
                and help someone get it back.
              </p>

            </div>

            <form
              className="report-form"
              onSubmit={handleSubmit}
            >

              <div className="form-group">

                <label>
                  Item Name
                </label>

                <input
                  type="text"
                  name="item_name"
                  placeholder="e.g. Black Wallet"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  placeholder="Describe the item you found..."
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Where did you find it?
                </label>

                <input
                  type="text"
                  name="location"
                  placeholder="e.g. Library, Block 34"
                  required
                />

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Date
                  </label>

                  <input
                    type="text"
                    name="report_date"
                    placeholder="DD/MM/YYYY"
                    value={date}
                    onChange={handleDateChange}
                    maxLength="10"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Upload Image
                  </label>

                  <input
                    className="file-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setImage(
                        e.target.files[0]
                      )
                    }
                  />

                </div>

              </div>

              {image && (
                <p className="selected-file">
                  📷 Selected: {image.name}
                  <br />

                  <small>
                    Image will be automatically
                    compressed for faster upload.
                  </small>
                </p>
              )}

              <button
                className="submit-report-btn found-submit-btn"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "⏳ Processing..."
                  : "🟢 Submit Found Report"}
              </button>

              <div className="report-navigation">

                <Link to="/home">

                  <button
                    type="button"
                    className="back-home-report-btn"
                  >
                    🏠 Back to Home
                  </button>

                </Link>

              </div>

            </form>
          </>
        ) : (

          <div className="success-message">

            <div className="success-icon">
              ✅
            </div>

            <h2>
              Report Submitted Successfully!
            </h2>

            <p>
              Your found item has been reported
              successfully. The owner can now
              find your report.
            </p>

            <button
              className="submit-report-btn found-submit-btn"
              onClick={() =>
                setSubmitted(false)
              }
            >
              ➕ Report Another Item
            </button>

            <div className="report-navigation">

              <Link to="/home">

                <button
                  type="button"
                  className="back-home-report-btn"
                >
                  🏠 Back to Home
                </button>

              </Link>

            </div>

          </div>

        )}

      </div>
    </div>
  );
}

export default ReportFound;