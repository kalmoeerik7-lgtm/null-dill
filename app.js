const BLOG = "https://nulldill.blogspot.com";
const $ = (s) => document.querySelector(s);
let posts = [], view = "home";
const favs = new Set(JSON.parse(localStorage.getItem("nd-favorites") || "[]"));
let list = JSON.parse(localStorage.getItem("nd-list") || "[]");

function jsonp(url){
  return new Promise((resolve,reject)=>{
    const cb="ndcb_"+Math.random().toString(36).slice(2);
    const script=document.createElement("script");
    const timer=setTimeout(()=>{cleanup();reject(new Error("Tidsavbrudd"));},12000);
    function cleanup(){clearTimeout(timer);delete window[cb];script.remove();}
    window[cb]=(data)=>{cleanup();resolve(data)};
    script.onerror=()=>{cleanup();reject(new Error("Kunne ikke hente blogginnholdet"))};
    script.src=url+(url.includes("?")?"&":"?")+"alt=json-in-script&callback="+cb;
    document.head.appendChild(script);
  });
}
function txt(html){const d=document.createElement("div");d.innerHTML=html||"";return d.textContent||d.innerText||""}
function getImage(html){const m=(html||"").match(/<img[^>]+src=["']([^"']+)/i);return m?m[1]:null}
function getLabels(entry){return (entry.category||[]).map(x=>x.term).filter(Boolean)}
function normalize(entry){return {id:entry.id?.$t||entry.title?.$t,url:entry.link?.find(x=>x.rel==="alternate")?.href||BLOG,title:entry.title?.$t||"Uten tittel",content:entry.content?.$t||entry.summary?.$t||"",summary:txt(entry.summary?.$t||entry.content?.$t||"").slice(0,145),image:getImage(entry.content?.$t||entry.summary?.$t||""),labels:getLabels(entry),published:entry.published?.$t||""}}
async function load(){
  try{
    const data=await jsonp(BLOG+"/feeds/posts/default?max-results=50");
    posts=(data.feed.entry||[]).map(normalize);
    $("#status").textContent=posts.length?`${posts.length} innlegg fra bloggen`:"Ingen publiserte innlegg ennå";
    renderCategories();render();
  }catch(e){
    $("#status").textContent="Fikk ikke kontakt med bloggen akkurat nå.";
    $("#recipes").innerHTML='<div class="empty">Oppskriftene kunne ikke lastes inn. Prøv å laste siden på nytt.</div>';
  }
}
function renderCategories(){
  const labels=[...new Set(posts.flatMap(p=>p.labels))].sort();
  $("#category").innerHTML='<option value="">Alle kategorier</option>'+labels.map(x=>`<option>${escapeHtml(x)}</option>`).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function card(p){return `<article class="recipe" data-id="${escapeHtml(p.id)}">${p.image?`<img loading="lazy" src="${escapeHtml(p.image)}" alt="">`:'<div class="placeholder">NULL DILL</div>'}<div class="recipe-info"><span class="tag">${escapeHtml(p.labels[0]||"Oppskrift")}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.summary||"Åpne oppskriften for å se mer.")}</p></div></article>`}
function render(){
  const q=$("#search").value.toLowerCase(),cat=$("#category").value;
  const data=posts.filter(p=>(!cat||p.labels.includes(cat))&&(!q||(p.title+" "+p.summary+" "+p.labels.join(" ")).toLowerCase().includes(q)));
  $("#recipes").innerHTML=data.length?data.map(card).join(""):'<div class="empty">Fant ingen oppskrifter. Prøv et annet søk.</div>';
  $("#recipes").querySelectorAll(".recipe").forEach(el=>el.addEventListener("click",()=>openRecipe(posts.find(p=>p.id===el.dataset.id))));
}
function openRecipe(p){
  if(!p)return;
  const recipeText = new DOMParser().parseFromString(p.content, "text/html").body.textContent;
const portionMatch = recipeText.match(/PORSJONER:\s*(\d+)/i);
const basePortions = portionMatch ? Number(portionMatch[1]) : 4;
let selectedPortions = basePortions;
  $("#recipeContent").innerHTML=`<div class="dialog-body">
<button class="fav-btn" id="toggleFav">${favs.has(p.id)?"♥ Lagret":"♡ Favoritt"}</button>
<span class="tag">${escapeHtml(p.labels.join(" · ")||"Oppskrift")}</span>
<h2>${escapeHtml(p.title)}</h2>
<div class="portion-picker">
<strong>Porsjoner</strong>
<div class="portion-controls">
<button id="minusPortion" class="portion-btn">−</button>
<span id="portionCount">${selectedPortions}</span>
<button id="plusPortion" class="portion-btn">+</button>
</div>
</div>
<button id="addIngredients" class="add-list-btn">
    🛒 Legg ingrediensene i handlelisten
</button>
<div id="recipeBody">${p.content}</div>
</div>`;  $("#toggleFav").onclick=()=>{favs.has(p.id)?favs.delete(p.id):favs.add(p.id);localStorage.setItem("nd-favorites",JSON.stringify([...favs]));$("#toggleFav").textContent=favs.has(p.id)?"♥ Lagret":"♡ Favoritt"};

$("#addIngredients").onclick = () => {
    const ingredients = [...$("#recipeBody").querySelectorAll("li")];

    const skip = /\b(vann|salt|pepper|olje)\b|smør/i;

    ingredients.forEach(item => {
        const name = item.textContent.trim();

        if (!name || skip.test(name) || /[.!?]$/.test(name)) return;

        const match = name.match(/^(?:ca\.?\s*)?([\d.,]+)\s*(g|dl|ss|ts)\s+(.+)$/i);

        if (match) {
            const amount = Number(match[1].replace(",", "."));
            const unit = match[2].toLowerCase();
            const ingredient = match[3].trim().toLowerCase();

            const existing = list.find(entry => {
                const old = entry.name.match(/^(?:ca\.?\s*)?([\d.,]+)\s*(g|dl|ss|ts)\s+(.+)$/i);

                return old &&
                    old[2].toLowerCase() === unit &&
                    old[3].trim().toLowerCase() === ingredient;
            });

            if (existing) {
                const old = existing.name.match(/^(?:ca\.?\s*)?([\d.,]+)\s*(g|dl|ss|ts)\s+(.+)$/i);
                const total = Number(old[1].replace(",", ".")) + amount;

                existing.name = `${Number(total.toFixed(2))} ${unit} ${match[3].trim()}`;
            } else {
                list.push({ name, done: false });
            }
        } else {
            const exists = list.some(
                entry => entry.name.toLowerCase() === name.toLowerCase()
            );

            if (!exists) {
                list.push({ name, done: false });
            }
        }
    });

    saveList();
    renderList();

    alert("Ingrediensene er lagt til i handlelisten!");
};
  $("#minusPortion").onclick=()=>{
    if(selectedPortions>1){
        selectedPortions--;
        updatePortions(selectedPortions, basePortions);
    }
};

$("#plusPortion").onclick=()=>{
    if(selectedPortions<20){
        selectedPortions++;
       updatePortions(selectedPortions, basePortions);
    }
};
updatePortions(selectedPortions, basePortions);
  $("#recipeDialog").showModal();
}
function updatePortions(selectedPortions, basePortions){
    $("#portionCount").textContent = selectedPortions;

    const factor = selectedPortions / basePortions;

    const recipeBody = $("#recipeBody");
    const items = recipeBody.querySelectorAll("li");

    items.forEach(item => {
        const original = item.dataset.original || item.textContent;
        item.dataset.original = original;

        item.textContent = original.replace(
            /(\d+(?:[.,]\d+)?)\s*(g|kg|dl|cl|ml|ss|ts)\b/gi,
            (match, amount, unit) => {
                const result = Number(amount.replace(",", ".")) * factor;
                return `${Number(result.toFixed(2))} ${unit}`;
            }
        );
    });
}
function setView(v){
  view=v;$("#recipes").classList.toggle("hidden",v!=="home");$("#favoritesView").classList.toggle("hidden",v!=="favorites");$("#listView").classList.toggle("hidden",v!=="list");
  $("#sectionTitle").textContent=v==="favorites"?"Favoritter":"Siste oppskrifter";
  if(v==="favorites"){const data=posts.filter(p=>favs.has(p.id));$("#favoritesView").innerHTML=data.length?`<div class="recipes">${data.map(card).join("")}</div>`:'<div class="empty">Du har ikke lagret noen favoritter ennå.</div>';$("#favoritesView").querySelectorAll(".recipe").forEach(el=>el.onclick=()=>openRecipe(posts.find(p=>p.id===el.dataset.id)))}
  $("#nav").classList.add("hidden");
}
function renderList(){ $("#shoppingList").innerHTML=list.map((x,i)=>`<li class="${x.done?"done":""}"><input type="checkbox" data-i="${i}" ${x.done?"checked":""}><span>${escapeHtml(x.name)}</span></li>`).join("");$("#shoppingList").querySelectorAll("input").forEach(el=>el.onchange=()=>{list[+el.dataset.i].done=el.checked;saveList()})}
function saveList(){localStorage.setItem("nd-list",JSON.stringify(list));renderList()}
$("#search").addEventListener("input",render);$("#category").addEventListener("change",render);
$("#menuBtn").onclick=()=>$("#nav").classList.toggle("hidden");
$("#nav").querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>setView(b.dataset.view));
$("#closeDialog").onclick=()=>$("#recipeDialog").close();
$("#addItem").onsubmit=e=>{e.preventDefault();const v=$("#newItem").value.trim();if(v){list.push({name:v,done:false});$("#newItem").value="";saveList()}};
$("#clearList").onclick=()=>{list=[];saveList()};
renderList();load();
