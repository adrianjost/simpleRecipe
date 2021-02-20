const DB_NAME = "simple-recipe-store";
const DB_STORE = "recipes";

let editor = null;

// HELPER START

function runAsync(f) {
  f().catch(console.error);
}

function throttle(callback, limit) {
  let waiting = false;
  return function () {
    if (!waiting) {
      callback.apply(this, arguments);
      waiting = true;
      setTimeout(() => {
        waiting = false;
      }, limit);
    }
  };
}


async function fetchAsDataURL(url){
  return url
  // return new Promise((resolve) => {
  //   const img = new Image();
  //   img.setAttribute('crossOrigin', 'anonymous');
  //   img.onload = function () {
  //       var canvas = document.createElement("canvas");
  //       canvas.width = this.width;
  //       canvas.height = this.height;
  //       var ctx = canvas.getContext("2d");
  //       ctx.drawImage(this, 0, 0);
  //       var dataURL = canvas.toDataURL("image/png");
  //       resolve(dataURL)
  //       alert(dataURL.replace(/^data:image\/(png|jpg);base64,/, ""));
  //   };
  //   img.src = url;
  // })
}
const convertToDataURL = (file) => new Promise(resolve => {
  var reader = new FileReader();
  reader.onloadend = function() {
    resolve(reader.result)
    console.log('RESULT', reader.result)
  }
  reader.readAsDataURL(file);
})

// HELPER END

// EDITOR TOOLS START

async function uploadByFile(file){
  console.log("uploadByFile", file)
  return {
    success: 1,
    file: {
      url: await convertToDataURL(file),
    }
  }
}

async function uploadByURL(url){
  console.log("uploadByURL", url)
  try{
    return {
      success: 1,
      file: {
        url: await fetchAsDataURL(url),
      }
    }
  }catch(error){
    return {
      success: 0,
    }
  }
  
}

// EDITOR TOOLS END

const dbPromise = idb.openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(DB_STORE);
  },
});
let db;

const saveChanges = throttle(() => {
  runAsync(async () => {
    if (editor === null) {
      throw new Error("editor not initialized");
    }
    const data = await editor.save();
    console.log("save", data);
    const db = await dbPromise;
    await db.put(DB_STORE, data, "recipe-id");
  });
}, 2000);

async function initEditor() {
  const data = await db.get(DB_STORE, "recipe-id");
  editor = new EditorJS({
    // Id of Element that should contain Editor instance
    holder: "editorjs",
    // Previously saved data that should be rendered
    data: data,
    // onChange callback
    onChange: saveChanges,

    tools: {
      image: {
        class: ImageTool,
        config: {
          uploader: {
            uploadByFile,
            uploadByUrl: uploadByURL
          }
        }
      }
    }
  });
}

async function init() {
  db = await dbPromise;
  await initEditor();
}
runAsync(init);
