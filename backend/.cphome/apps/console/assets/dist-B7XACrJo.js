import{o as e}from"./chunk-CMxvf4Kt.js";import{t}from"./react-CoHAqsLe.js";import{$n as n,$t as r,A as i,Cn as a,En as o,G as s,Gn as c,I as l,In as u,Jn as d,Kn as f,Mn as p,N as m,Ni as h,P as g,Pi as _,Sr as v,Tn as y,U as b,Vn as x,W as S,Yn as C,ar as w,at as T,br as E,c as D,ct as O,dt as k,en as A,fn as j,ft as M,ht as N,i as P,it as F,j as I,k as L,kn as R,lt as z,mr as ee,ni as te,nr as B,o as ne,pn as re,pt as V,q as ie,rr as H,s as ae,st as oe,tn as se,tr as ce,tt as le,u as ue,ut as de,vr as U,xr as W,z as G,zn as fe,zt as K}from"./dist-ByIdA76I.js";import{p as pe,t as me,u as he,w as ge}from"./dist-CT3Z8KIW.js";import{B as _e,F as ve,G as ye,I as be,J as xe,L as Se,M as Ce,N as we,P as Te,R as Ee,U as q,V as J,W as Y,_ as De,i as Oe,j as ke,q as Ae,z as je}from"./dist-DNqDNCEj.js";import{Gn as Me,Js as Ne,Ju as Pe,UT as Fe,cx as Ie,en as Le,fu as Re,qS as ze,ux as Be,wA as Ve}from"./dist-WU-LjddX.js";import{t as He}from"./AlertTitle-CXI1M9Fy.js";import{t as Ue}from"./CardActionArea-DT1hk4oe.js";import{i as We,r as Ge,t as Ke}from"./DialogContent-Ltzdp0jw.js";import{t as qe}from"./DialogContentText-CTxpHYVJ.js";import{t as Je}from"./DialogTitle-BzeFqVC5.js";import{t as Ye}from"./ResourceAvatar-_L6vAEO3.js";import{t as Xe}from"./useMutation-D4rpW89W.js";import{t as Ze}from"./ExternalLink-YRIYL2M4.js";import{t as Qe}from"./FullScreenCreationWizardLayout-C_UV-a1_.js";import{n as $e,r as et}from"./dist-1xHOOTm7.js";import{t as tt}from"./QueryErrorNotice-B14CQu19.js";import{t as nt}from"./SettingsCard-CULFQmI1.js";import{t as rt}from"./UnsavedChangesBar-B9N61flk.js";import{a as it,c as at}from"./hooks-DsDDyDCI.js";import{n as ot}from"./lib-5lueFAMr.js";import{a as st,c as ct,i as lt,l as ut,o as dt,s as ft}from"./schemas-D21WbBxU.js";var X=e(t(),1),pt=(0,X.createContext)({}),mt=(0,X.createContext)(void 0),ht=e=>{let t=(0,X.useContext)(ue),n=(0,X.useContext)(mt)?.i18n;if(!t)throw Error(`useTranslation must be used within an I18nProvider. Make sure your component is wrapped with ThunderIDProvider which includes I18nProvider.`);let r=e??n,{t:i,currentLanguage:a,setLanguage:o,bundles:s,fallbackLanguage:c}=t,l=(0,X.useMemo)(()=>{if(!r?.bundles)return s;let e={};return Object.entries(s).forEach(([t,n])=>{e[t]=n}),Object.entries(r.bundles).forEach(([t,n])=>{let r=O(n.translations);e[t]?e[t]={...e[t],metadata:n.metadata?{...e[t].metadata,...n.metadata}:e[t].metadata,translations:ie(e[t].translations,r)}:e[t]={...n,translations:r}}),e},[s,r?.bundles]),u=(0,X.useMemo)(()=>r?.bundles?(e,t)=>{let n,r=l[a];if(r?.translations?.[e]&&(n=r.translations[e]),!n&&a!==c){let t=l[c];t?.translations?.[e]&&(n=t.translations[e])}return n||=e,k(n,t)}:i,[l,a,c,i,r?.bundles]);return{availableLanguages:Object.keys(l),currentLanguage:a,setLanguage:o,t:u}},gt=(e,t,n=[`label`,`placeholder`,`text`,`title`,`subtitle`],r)=>{let i={...e};return n.forEach(e=>{i[e]&&typeof i[e]==`string`&&(i[e]=z(i[e],{meta:r,t}))}),i},_t=(e,t,n,r)=>e.map(e=>{let i=gt(e,t,n,r);return i.components&&Array.isArray(i.components)&&(i.components=_t(i.components,t,n,r)),i}),vt=_t,yt=e=>{let t=new Map;return e?.data?.inputs&&Array.isArray(e.data.inputs)&&e.data.inputs.forEach(e=>{e.ref&&e.identifier&&t.set(e.ref,e.identifier)}),t},bt=e=>{let t=new Map;return e?.data?.actions&&Array.isArray(e.data.actions)&&e.data.actions.forEach(e=>{e.ref&&e.nextNode&&t.set(e.ref,e.nextNode)}),t},xt=(e,t,n,r=[])=>e.map(e=>{let i={...e};if(i.ref&&t.has(i.ref)&&(i.ref=t.get(i.ref)),i.type===`SELECT`&&e.id){let t=r.find(t=>t.ref===e.id);t?.options&&(i.options=t.options.map(e=>{if(typeof e==`string`)return{label:e,value:e};let t=typeof e.value==`object`?JSON.stringify(e.value):String(e.value||``);return{label:typeof e.label==`object`?JSON.stringify(e.label):String(e.label||t),value:t}}))}return i.type===`ACTION`&&i.id&&n.has(i.id)&&(i.actionRef=n.get(i.id)),i.components&&Array.isArray(i.components)&&(i.components=xt(i.components,t,n,r)),i}),St=(e,t,n=!0,r)=>{if(!e?.data?.meta?.components)return[];let{components:i}=e.data.meta,a=yt(e),o=bt(e),s=e?.data?.inputs||[];return(a.size>0||o.size>0||s.length>0)&&(i=xt(i,a,o,s)),n?vt(i,t,void 0,r):i},Ct=(e,t,n=`errors.flow.generic`)=>{if(e&&typeof e==`object`&&e.error){let n=e.error;if(n?.message?.key){let e=n.message.params,r=t(n.message.key,e);if(r&&r!==n.message.key&&!T(r))return r;let i=`system.${n.message.key}`,a=t(i,e);if(a&&a!==i&&!T(a))return a}let r=n?.message?.defaultValue??n?.description?.defaultValue;if(r)return r}return e&&typeof e==`object`&&e.failureReason?e.failureReason:e instanceof Error&&e.message?e.message:t(n)},wt=(e,t,n=`errors.flow.generic`)=>e?.flowStatus===`ERROR`?Ct(e,t,n):null,Tt=(e,t,n={},r)=>{let{throwOnError:i=!0,defaultErrorKey:a=`errors.flow.generic`,resolveTranslations:o=!0}=n;if(wt(e,t,a)&&i)throw e;let s=e?.data?.additionalData??{};if(typeof s.consentPrompt==`string`)try{let e=JSON.parse(s.consentPrompt);s.consentPrompt={purposes:Array.isArray(e)?e:[]}}catch{}return{additionalData:s,components:St(e,t,o,r),executionId:e.executionId}},Et=(e,t,n,r,i)=>(0,X.useMemo)(()=>{let t=r||e.vars.colors.primary.main,a={large:`32px`,medium:`20px`,small:`16px`},o=a[n],s=q`
      width: ${o};
      height: ${o};
      border: 2px solid transparent;
      border-top: 2px solid ${t};
      border-radius: 50%;
      animation: ${ye`
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    `} 1s linear infinite;
      display: inline-block;
    `,c=q`
      width: ${a.small};
      height: ${a.small};
    `,l=q`
      width: ${a.medium};
      height: ${a.medium};
    `,u=q`
      width: ${a.large};
      height: ${a.large};
    `;return{spinner:s,spinnerCustomSize:i?q`
          width: ${i};
          height: ${i};
        `:``,spinnerLarge:u,spinnerMedium:l,spinnerSmall:c}},[e,t,n,r,i]),Z=h(),Dt=({size:e=`medium`,color:t,className:n,widthOverride:r=void 0})=>{let{theme:i,colorScheme:a}=J(),o=Et(i,a,e,t,r);return(0,Z.jsx)(`span`,{className:Y(M(b(`spinner`)),o.spinner,e===`small`&&o.spinnerSmall,e===`medium`&&o.spinnerMedium,e===`large`&&o.spinnerLarge,r&&o.spinnerCustomSize,n),role:`status`,"aria-label":`Loading`})},Ot=(e,t,n,r,i,a,o,s,c=`square`)=>(0,X.useMemo)(()=>{let t={large:`calc(${e.vars.spacing.unit} * 5)`,medium:`calc(${e.vars.spacing.unit} * 4)`,small:`calc(${e.vars.spacing.unit} * 3)`},l=t[i]||t.medium,u=q`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: calc(${e.vars.spacing.unit} * 1);
      border-radius: ${c===`round`?`50%`:e.vars.components?.Button?.root?.borderRadius||e.vars.borderRadius.medium};
      font-weight: 500;
      cursor: ${o||s?`not-allowed`:`pointer`};
      outline: none;
      text-decoration: none;
      white-space: nowrap;
      width: ${a?`100%`:`auto`};
      opacity: ${o||s?.6:1};
      font-family: ${e.vars.typography.fontFamily};
      border-width: 1px;
      border-style: solid;
      ${r===`icon`?`
        padding: 0;
        min-width: unset;
        min-height: unset;
        width: ${l};
        height: ${l};
        justify-content: center;
        align-items: center;
      `:``}
    `,d={large:q`
        ${r===`icon`?`font-size: ${e.vars.typography.fontSizes.lg};`:`padding: calc(${e.vars.spacing.unit} * 1.5) calc(${e.vars.spacing.unit} * 3);
             font-size: ${e.vars.typography.fontSizes.lg};
             min-height: calc(${e.vars.spacing.unit} * 5);`}
      `,medium:q`
        ${r===`icon`?`font-size: ${e.vars.typography.fontSizes.md};`:`padding: calc(${e.vars.spacing.unit} * 1) calc(${e.vars.spacing.unit} * 2);
             font-size: ${e.vars.typography.fontSizes.md};
             min-height: calc(${e.vars.spacing.unit} * 4);`}
      `,small:q`
        ${r===`icon`?`font-size: ${e.vars.typography.fontSizes.sm};`:`padding: calc(${e.vars.spacing.unit} * 0.5) calc(${e.vars.spacing.unit} * 1);
             font-size: ${e.vars.typography.fontSizes.sm};
             min-height: calc(${e.vars.spacing.unit} * 3);`}
      `},f={"primary-icon":q`
        background-color: transparent;
        color: ${e.vars.colors.primary.main};
        border-color: transparent;
        &:hover:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.hover};
          color: ${e.vars.colors.primary.dark};
        }
        &:active:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.selected};
          color: ${e.vars.colors.primary.dark};
        }
        &:focus:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.focus};
          color: ${e.vars.colors.primary.dark};
          outline: none;
        }
      `,"primary-outline":q`
        background-color: transparent;
        color: ${e.vars.colors.primary.main};
        border-color: ${e.vars.colors.primary.main};
        &:hover:not(:disabled) {
          background-color: ${e.vars.colors.primary.main};
          color: ${e.vars.colors.primary.contrastText};
        }
        &:active:not(:disabled) {
          background-color: ${e.vars.colors.primary.main};
          color: ${e.vars.colors.primary.contrastText};
          opacity: 0.9;
        }
        &:focus:not(:disabled) {
          background-color: ${e.vars.colors.primary.main};
          color: ${e.vars.colors.primary.contrastText};
          opacity: 0.9;
        }
      `,"primary-solid":q`
        background-color: ${e.vars.colors.primary.main};
        color: ${e.vars.colors.primary.contrastText};
        border-color: ${e.vars.colors.primary.main};
        &:hover:not(:disabled) {
          background-color: ${e.vars.colors.primary.main};
          opacity: 0.9;
        }
        &:active:not(:disabled) {
          background-color: ${e.vars.colors.primary.main};
          opacity: 0.8;
        }
        &:focus:not(:disabled) {
          background-color: ${e.vars.colors.primary.main};
          opacity: 0.8;
        }
      `,"primary-text":q`
        background-color: transparent;
        color: ${e.vars.colors.primary.main};
        border-color: transparent;
        &:hover:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.hover};
        }
        &:active:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.selected};
        }
        &:focus:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.focus};
          outline: none;
        }
      `,"secondary-icon":q`
        background-color: transparent;
        color: ${e.vars.colors.secondary.main};
        border-color: transparent;
        &:hover:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.hover};
          color: ${e.vars.colors.secondary.dark};
        }
        &:active:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.selected};
          color: ${e.vars.colors.secondary.dark};
        }
        &:focus:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.focus};
          color: ${e.vars.colors.secondary.dark};
          outline: none;
        }
      `,"secondary-outline":q`
        background-color: transparent;
        color: ${e.vars.colors.secondary.main};
        border-color: ${e.vars.colors.secondary.main};
        &:hover:not(:disabled) {
          background-color: ${e.vars.colors.secondary.main};
          color: ${e.vars.colors.secondary.contrastText};
        }
        &:active:not(:disabled) {
          background-color: ${e.vars.colors.secondary.main};
          color: ${e.vars.colors.secondary.contrastText};
          opacity: 0.9;
        }
        &:focus:not(:disabled) {
          background-color: ${e.vars.colors.secondary.main};
          color: ${e.vars.colors.secondary.contrastText};
          opacity: 0.9;
        }
      `,"secondary-solid":q`
        background-color: ${e.vars.colors.secondary.main};
        color: ${e.vars.colors.secondary.contrastText};
        border-color: ${e.vars.colors.secondary.main};
        &:hover:not(:disabled) {
          background-color: ${e.vars.colors.secondary.main};
          opacity: 0.9;
        }
        &:active:not(:disabled) {
          background-color: ${e.vars.colors.secondary.main};
          opacity: 0.8;
        }
        &:focus:not(:disabled) {
          background-color: ${e.vars.colors.secondary.main};
          opacity: 0.8;
        }
      `,"secondary-text":q`
        background-color: transparent;
        color: ${e.vars.colors.secondary.main};
        border-color: transparent;
        &:hover:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.hover};
        }
        &:active:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.selected};
        }
        &:focus:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.focus};
          outline: none;
        }
      `,"tertiary-icon":q`
        background-color: transparent;
        color: ${e.vars.colors.text.secondary};
        border-color: transparent;
        &:hover:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.hover};
          color: ${e.vars.colors.text.primary};
        }
        &:active:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.selected};
          color: ${e.vars.colors.text.primary};
        }
        &:focus:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.focus};
          color: ${e.vars.colors.text.primary};
          outline: none;
        }
      `,"tertiary-outline":q`
        background-color: transparent;
        color: ${e.vars.colors.text.secondary};
        border-color: ${e.vars.colors.border};
        &:hover:not(:disabled) {
          background-color: ${e.vars.colors.action.hover};
          border-color: ${e.vars.colors.text.secondary};
        }
        &:active:not(:disabled) {
          background-color: ${e.vars.colors.action.selected};
          border-color: ${e.vars.colors.text.primary};
        }
        &:focus:not(:disabled) {
          background-color: ${e.vars.colors.action.focus};
          border-color: ${e.vars.colors.text.primary};
        }
      `,"tertiary-solid":q`
        background-color: ${e.vars.colors.text.secondary};
        color: ${e.vars.colors.background.surface};
        border-color: ${e.vars.colors.text.secondary};
        &:hover:not(:disabled) {
          background-color: ${e.vars.colors.text.primary};
          color: ${e.vars.colors.background.surface};
        }
        &:active:not(:disabled) {
          background-color: ${e.vars.colors.text.primary};
          color: ${e.vars.colors.background.surface};
          opacity: 0.9;
        }
        &:focus:not(:disabled) {
          background-color: ${e.vars.colors.text.primary};
          color: ${e.vars.colors.background.surface};
          opacity: 0.9;
        }
      `,"tertiary-text":q`
        background-color: transparent;
        color: ${e.vars.colors.text.secondary};
        border-color: transparent;
        &:hover:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.hover};
          color: ${e.vars.colors.text.primary};
        }
        &:active:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.selected};
          color: ${e.vars.colors.text.primary};
        }
        &:focus:not(:disabled) {
          border-color: transparent;
          background-color: ${e.vars.colors.action.focus};
          color: ${e.vars.colors.text.primary};
          outline: none;
        }
      `},p=q`
      display: flex;
      align-items: center;
      justify-content: center;
    `,m=q`
      display: flex;
      align-items: center;
      justify-content: center;
    `;return{button:u,content:q`
      display: flex;
      align-items: center;
      justify-content: center;
    `,endIcon:m,fullWidth:a?q`
            width: 100%;
          `:null,icon:m,loading:s?q`
            pointer-events: none;
          `:null,shape:c===`round`?q`
              border-radius: 50%;
            `:null,size:d[i],spinner:p,startIcon:m,variant:f[`${n}-${r}`]||f[`primary-solid`]}},[e,t,n,r,i,a,o,s]),kt=(e,t)=>e===`small`?`calc(${t} * 1.5)`:e===`medium`?`calc(${t} * 2)`:`calc(${t} * 2.5)`,At=(0,X.forwardRef)(({color:e=`primary`,variant:t=`solid`,size:n=`medium`,fullWidth:r=!1,loading:i=!1,startIcon:a,endIcon:o,children:s,className:c,disabled:l,style:u,shape:d=`square`,...f},p)=>{let{theme:m,colorScheme:h}=J(),g=Ot(m,h,e,t,n,r,l||!1,i,d),_=t===`icon`,v=kt(n,m.vars.spacing.unit);return(0,Z.jsxs)(`button`,{ref:p,style:u,className:Y(M(b(`button`)),M(b(`button`,t)),M(b(`button`,e)),M(b(`button`,n)),M(b(`button`,d)),r?M(b(`button`,`fullWidth`)):void 0,i?M(b(`button`,`loading`)):void 0,l||i?M(b(`button`,`disabled`)):void 0,g.button,g.size,g.variant,g.fullWidth,g.loading,g.shape,c),disabled:l||i,...f,children:[i&&(0,Z.jsx)(`span`,{className:Y(M(b(`button`,`spinner`)),g.spinner),children:(0,Z.jsx)(Dt,{size:n,color:`currentColor`,widthOverride:v})}),!i&&_&&(0,Z.jsx)(`span`,{className:Y(M(b(`button`,`icon`)),g.icon),children:s||a||o}),!i&&!_&&a&&(0,Z.jsx)(`span`,{className:Y(M(b(`button`,`start-icon`)),g.startIcon),children:a}),!_&&s&&(0,Z.jsx)(`span`,{className:Y(M(b(`button`,`content`)),g.content),children:s}),!i&&!_&&o&&(0,Z.jsx)(`span`,{className:Y(M(b(`button`,`end-icon`)),g.endIcon),children:o})]})});At.displayName=`Button`;var jt=At,Mt=e=>(0,Z.jsxs)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,width:`24`,height:`24`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,...e,children:[(0,Z.jsx)(`circle`,{cx:`12`,cy:`12`,r:`10`}),(0,Z.jsx)(`line`,{x1:`12`,x2:`12`,y1:`8`,y2:`12`}),(0,Z.jsx)(`line`,{x1:`12`,x2:`12.01`,y1:`16`,y2:`16`})]}),Nt=e=>(0,Z.jsxs)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,width:`24`,height:`24`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,...e,children:[(0,Z.jsx)(`circle`,{cx:`12`,cy:`12`,r:`10`}),(0,Z.jsx)(`path`,{d:`m9 12 2 2 4-4`})]}),Pt=e=>(0,Z.jsxs)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,width:`24`,height:`24`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,...e,children:[(0,Z.jsx)(`path`,{d:`m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3`}),(0,Z.jsx)(`path`,{d:`M12 9v4`}),(0,Z.jsx)(`path`,{d:`M12 17h.01`})]}),Ft=(e,t,n)=>(0,X.useMemo)(()=>{let t=q`
      padding: calc(${e.vars.spacing.unit} * 2);
      border-radius: ${e.vars.borderRadius.medium};
      border: 1px solid;
      font-family: ${e.vars.typography.fontFamily};
      display: flex;
      gap: calc(${e.vars.spacing.unit} * 1.5);
      align-items: flex-start;
    `,r={error:q`
        background-color: color-mix(in srgb, ${e.vars.colors.error.main} 20%, white);
        border-color: ${e.vars.colors.error.main};
        color: ${e.vars.colors.error.main};
      `,info:q`
        background-color: color-mix(in srgb, ${e.vars.colors.info.main} 20%, white);
        border-color: ${e.vars.colors.info.main};
        color: ${e.vars.colors.info.main};
      `,success:q`
        background-color: color-mix(in srgb, ${e.vars.colors.success.main} 20%, white);
        border-color: ${e.vars.colors.success.main};
        color: ${e.vars.colors.success.main};
      `,warning:q`
        background-color: color-mix(in srgb, ${e.vars.colors.warning.main} 20%, white);
        border-color: ${e.vars.colors.warning.main};
        color: ${e.vars.colors.warning.main};
      `},i=q`
      flex-shrink: 0;
      margin-top: calc(${e.vars.spacing.unit} * 0.25);
      width: calc(${e.vars.spacing.unit} * 2.5);
      height: calc(${e.vars.spacing.unit} * 2.5);
      color: ${e.vars.colors[n]?.contrastText};
    `,a=q`
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: ${e.vars.spacing.unit};
    `,o=q`
      margin: 0;
      font-size: ${e.vars.typography.fontSizes.sm};
      font-weight: 600;
      line-height: 1.4;
      color: ${e.vars.colors[n]?.contrastText};
    `;return{alert:t,content:a,description:q`
      margin: 0;
      font-size: ${e.vars.typography.fontSizes.sm};
      line-height: 1.4;
      color: ${e.vars.colors.text.secondary};
    `,icon:i,title:o,variant:r[n]}},[e,t,n]),It=e=>{switch(e){case`success`:return Nt;case`error`:return Mt;case`warning`:return Pt;case`info`:return _e;default:return _e}},Lt=(0,X.createContext)(`info`),Rt=()=>(0,X.useContext)(Lt),zt=(0,X.forwardRef)(({variant:e=`info`,showIcon:t=!0,children:n,className:r,style:i,...a},o)=>{let{theme:s,colorScheme:c}=J(),l=Ft(s,c,e),u=It(e);return(0,Z.jsx)(Lt.Provider,{value:e,children:(0,Z.jsxs)(`div`,{ref:o,role:`alert`,style:i,className:Y(M(b(`alert`)),l.alert,l.variant,M(b(`alert`,null,e)),r),...a,children:[t&&(0,Z.jsx)(`div`,{className:Y(M(b(`alert`,`icon`)),l.icon),children:(0,Z.jsx)(u,{})}),(0,Z.jsx)(`div`,{className:Y(M(b(`alert`,`content`)),l.content),children:n})]})})}),Bt=({children:e,className:t,style:n,...r})=>{let{theme:i,colorScheme:a}=J(),o=Ft(i,a,Rt()),{color:s,...c}=r;return(0,Z.jsx)(je,{component:`h3`,variant:`h6`,fontWeight:600,style:n,className:Y(M(b(`alert`,`title`)),o.title,t),...c,children:e})},Vt=({children:e,className:t,style:n,...r})=>{let{theme:i,colorScheme:a}=J(),o=Ft(i,a,Rt()),{color:s,...c}=r;return(0,Z.jsx)(je,{component:`p`,variant:`body2`,style:n,className:Y(M(b(`alert`,`description`)),o.description,t),...c,children:e})};zt.displayName=`Alert`,Bt.displayName=`Alert.Title`,Vt.displayName=`Alert.Description`,zt.Title=Bt,zt.Description=Vt;var Ht=zt,Ut=(e,t,n,r)=>(0,X.useMemo)(()=>{let t=q`
      border-radius: ${e.vars.borderRadius.medium};
      background-color: ${e.vars.colors.background.surface};
      font-family: ${e.vars.typography.fontFamily};
      transition: all 0.2s ease-in-out;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: calc(${e.vars.spacing.unit} * 2);
    `,i={default:q`
        /* Base styles only */
      `,elevated:q`
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border: none;
      `,outlined:q`
        border: 1px solid ${e.vars.colors.border};
      `},a=q`
      cursor: pointer;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    `,o=q`
      padding: 0 calc(${e.vars.spacing.unit} * 2);
      margin-top: calc(${e.vars.spacing.unit} * 2);
      display: flex;
      flex-direction: column;
      gap: ${e.vars.spacing.unit};
    `,s=q`
      margin: 0;
      /* Typography component will handle color, fontSize, fontWeight, lineHeight */
    `,c=q`
      margin: 0;
      color: ${e.vars.colors.text.secondary};
      font-size: ${e.vars.typography.fontSizes.sm};
      line-height: 1.5;
    `,l=q`
      margin-top: ${e.vars.spacing.unit};
    `,u=q`
      padding: 0 calc(${e.vars.spacing.unit} * 2);
      margin-bottom: calc(${e.vars.spacing.unit} * 2);
      flex: 1;
    `,d=q`
      padding: 0 calc(${e.vars.spacing.unit} * 2) calc(${e.vars.spacing.unit} * 2);
      display: flex;
      align-items: center;
      gap: ${e.vars.spacing.unit};
    `;return{action:l,card:t,clickable:r?a:``,content:u,description:c,footer:d,header:o,title:s,variant:i[n]}},[e,t,n,r]),Wt=(0,X.forwardRef)(({variant:e=`default`,clickable:t=!1,children:n,className:r,style:i,...a},o)=>{let{theme:s,colorScheme:c}=J(),l=Ut(s,c,e,t);return(0,Z.jsx)(`div`,{ref:o,style:i,className:Y(M(b(`card`)),l.card,l.variant,l.clickable,M(b(`card`,null,e)),{[M(b(`card`,null,`clickable`))]:t},r),...a,children:n})}),Gt=(0,X.forwardRef)(({children:e,className:t,style:n,...r},i)=>{let{theme:a,colorScheme:o}=J(),s=Ut(a,o,`default`,!1);return(0,Z.jsx)(`div`,{ref:i,style:n,className:Y(M(b(`card`,`header`)),s.header,t),...r,children:e})}),Kt=({children:e,level:t=3,className:n,style:r,...i})=>{let{theme:a,colorScheme:o}=J(),s=Ut(a,o,`default`,!1),c=e=>{switch(e){case 1:return`h1`;case 2:return`h2`;case 3:return`h3`;case 4:return`h4`;case 5:return`h5`;case 6:return`h6`;default:return`h3`}},l=e=>{switch(e){case 1:return`h1`;case 2:return`h2`;case 3:return`h3`;case 4:return`h4`;case 5:return`h5`;case 6:return`h6`;default:return`h3`}},{color:u,...d}=i;return(0,Z.jsx)(je,{component:l(t),variant:c(t),style:r,className:Y(M(b(`card`,`title`)),s.title,n),fontWeight:600,...d,children:e})},qt=({children:e,className:t,style:n,...r})=>{let{theme:i,colorScheme:a}=J(),o=Ut(i,a,`default`,!1),{color:s,...c}=r;return(0,Z.jsx)(je,{component:`p`,variant:`body2`,color:`textSecondary`,style:n,className:Y(M(b(`card`,`description`)),o.description,t),...c,children:e})},Jt=(0,X.forwardRef)(({children:e,className:t,style:n,...r},i)=>{let{theme:a,colorScheme:o}=J(),s=Ut(a,o,`default`,!1);return(0,Z.jsx)(`div`,{ref:i,style:n,className:Y(M(b(`card`,`action`)),s.action,t),...r,children:e})}),Yt=(0,X.forwardRef)(({children:e,className:t,style:n,...r},i)=>{let{theme:a,colorScheme:o}=J(),s=Ut(a,o,`default`,!1);return(0,Z.jsx)(`div`,{ref:i,style:n,className:Y(M(b(`card`,`content`)),s.content,t),...r,children:e})}),Xt=(0,X.forwardRef)(({children:e,className:t,style:n,...r},i)=>{let{theme:a,colorScheme:o}=J(),s=Ut(a,o,`default`,!1);return(0,Z.jsx)(`div`,{ref:i,style:n,className:Y(M(b(`card`,`footer`)),s.footer,t),...r,children:e})});Wt.displayName=`Card`,Gt.displayName=`Card.Header`,Kt.displayName=`Card.Title`,qt.displayName=`Card.Description`,Jt.displayName=`Card.Action`,Yt.displayName=`Card.Content`,Xt.displayName=`Card.Footer`,Wt.Header=Gt,Wt.Title=Kt,Wt.Description=qt,Wt.Action=Jt,Wt.Content=Yt,Wt.Footer=Xt;var Zt=Wt,Qt=e=>(0,Z.jsxs)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,width:`24`,height:`24`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,...e,children:[(0,Z.jsx)(`path`,{d:`M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0`}),(0,Z.jsx)(`circle`,{cx:`12`,cy:`12`,r:`3`})]}),$t=e=>(0,Z.jsxs)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,width:`24`,height:`24`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,...e,children:[(0,Z.jsx)(`path`,{d:`M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49`}),(0,Z.jsx)(`path`,{d:`M14.084 14.158a3 3 0 0 1-4.242-4.242`}),(0,Z.jsx)(`path`,{d:`M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143`}),(0,Z.jsx)(`path`,{d:`m2 2 20 20`})]}),en=({isLoading:e,preferences:t,children:n,...r})=>{let{t:i}=ht(t?.i18n);return(0,Z.jsx)(jt,{...r,fullWidth:!0,type:`button`,color:`primary`,variant:`solid`,disabled:e,startIcon:(0,Z.jsxs)(`svg`,{width:`18`,height:`18`,viewBox:`0 0 512 512`,xmlns:`http://www.w3.org/2000/svg`,children:[(0,Z.jsx)(`path`,{fill:`#1976D2`,d:`M448,0H64C28.704,0,0,28.704,0,64v384c0,35.296,28.704,64,64,64h384c35.296,0,64-28.704,64-64V64C512,28.704,483.296,0,448,0z`}),(0,Z.jsx)(`path`,{fill:`#FAFAFA`,d:`M432,256h-80v-64c0-17.664,14.336-16,32-16h32V96h-64l0,0c-53.024,0-96,42.976-96,96v64h-64v80h64v176h96V336h48L432,256z`})]}),children:n??i(`elements.buttons.facebook.text`)})},tn=({isLoading:e,preferences:t,children:n,...r})=>{let{t:i}=ht(t?.i18n);return(0,Z.jsx)(jt,{...r,fullWidth:!0,type:`button`,color:`secondary`,variant:`solid`,disabled:e,startIcon:(0,Z.jsx)(`svg`,{width:`18`,height:`18`,viewBox:`0 0 67.91 66.233`,xmlns:`http://www.w3.org/2000/svg`,children:(0,Z.jsx)(`g`,{transform:`translate(-386.96 658.072)`,children:(0,Z.jsx)(`path`,{d:`M420.915-658.072a33.956,33.956,0,0,0-33.955,33.955,33.963,33.963,0,0,0,23.221,32.22c1.7.314,2.32-.737,2.32-1.633,0-.81-.031-3.484-.046-6.322-9.446,2.054-11.44-4.006-11.44-4.006-1.545-3.925-3.77-4.968-3.77-4.968-3.081-2.107.232-2.064.232-2.064,3.41.239,5.205,3.5,5.205,3.5,3.028,5.19,7.943,3.69,9.881,2.822a7.23,7.23,0,0,1,2.156-4.54c-7.542-.859-15.47-3.77-15.47-16.781a13.141,13.141,0,0,1,3.5-9.114,12.2,12.2,0,0,1,.329-8.986s2.851-.913,9.34,3.48a32.545,32.545,0,0,1,8.5-1.143,32.629,32.629,0,0,1,8.506,1.143c6.481-4.393,9.328-3.48,9.328-3.48a12.185,12.185,0,0,1,.333,8.986,13.115,13.115,0,0,1,3.495,9.114c0,13.042-7.943,15.913-15.5,16.754,1.218,1.054,2.3,3.12,2.3,6.288,0,4.543-.039,8.2-.039,9.318,0,.9.611,1.962,2.332,1.629a33.959,33.959,0,0,0,23.2-32.215,33.955,33.955,0,0,0-33.955-33.955`,fill:`#ffffff`})})}),children:n??i(`elements.buttons.github.text`)})},nn=()=>(0,Z.jsxs)(`svg`,{width:`18`,height:`18`,viewBox:`0 0 268.1522 273.8827`,xmlns:`http://www.w3.org/2000/svg`,children:[(0,Z.jsxs)(`defs`,{children:[(0,Z.jsxs)(`linearGradient`,{id:`google-btn-a`,children:[(0,Z.jsx)(`stop`,{offset:`0`,stopColor:`#0fbc5c`}),(0,Z.jsx)(`stop`,{offset:`1`,stopColor:`#0cba65`})]}),(0,Z.jsxs)(`linearGradient`,{id:`google-btn-g`,children:[(0,Z.jsx)(`stop`,{offset:`.2312727`,stopColor:`#0fbc5f`}),(0,Z.jsx)(`stop`,{offset:`.3115468`,stopColor:`#0fbc5f`}),(0,Z.jsx)(`stop`,{offset:`.3660131`,stopColor:`#0fbc5e`}),(0,Z.jsx)(`stop`,{offset:`.4575163`,stopColor:`#0fbc5d`}),(0,Z.jsx)(`stop`,{offset:`.540305`,stopColor:`#12bc58`}),(0,Z.jsx)(`stop`,{offset:`.6993464`,stopColor:`#28bf3c`}),(0,Z.jsx)(`stop`,{offset:`.7712418`,stopColor:`#38c02b`}),(0,Z.jsx)(`stop`,{offset:`.8605665`,stopColor:`#52c218`}),(0,Z.jsx)(`stop`,{offset:`.9150327`,stopColor:`#67c30f`}),(0,Z.jsx)(`stop`,{offset:`1`,stopColor:`#86c504`})]}),(0,Z.jsxs)(`linearGradient`,{id:`google-btn-h`,children:[(0,Z.jsx)(`stop`,{offset:`.1416122`,stopColor:`#1abd4d`}),(0,Z.jsx)(`stop`,{offset:`.2475151`,stopColor:`#6ec30d`}),(0,Z.jsx)(`stop`,{offset:`.3115468`,stopColor:`#8ac502`}),(0,Z.jsx)(`stop`,{offset:`.3660131`,stopColor:`#a2c600`}),(0,Z.jsx)(`stop`,{offset:`.4456735`,stopColor:`#c8c903`}),(0,Z.jsx)(`stop`,{offset:`.540305`,stopColor:`#ebcb03`}),(0,Z.jsx)(`stop`,{offset:`.6156363`,stopColor:`#f7cd07`}),(0,Z.jsx)(`stop`,{offset:`.6993454`,stopColor:`#fdcd04`}),(0,Z.jsx)(`stop`,{offset:`.7712418`,stopColor:`#fdce05`}),(0,Z.jsx)(`stop`,{offset:`.8605661`,stopColor:`#ffce0a`})]}),(0,Z.jsxs)(`linearGradient`,{id:`google-btn-f`,children:[(0,Z.jsx)(`stop`,{offset:`.3159041`,stopColor:`#ff4c3c`}),(0,Z.jsx)(`stop`,{offset:`.6038179`,stopColor:`#ff692c`}),(0,Z.jsx)(`stop`,{offset:`.7268366`,stopColor:`#ff7825`}),(0,Z.jsx)(`stop`,{offset:`.884534`,stopColor:`#ff8d1b`}),(0,Z.jsx)(`stop`,{offset:`1`,stopColor:`#ff9f13`})]}),(0,Z.jsxs)(`linearGradient`,{id:`google-btn-b`,children:[(0,Z.jsx)(`stop`,{offset:`.2312727`,stopColor:`#ff4541`}),(0,Z.jsx)(`stop`,{offset:`.3115468`,stopColor:`#ff4540`}),(0,Z.jsx)(`stop`,{offset:`.4575163`,stopColor:`#ff4640`}),(0,Z.jsx)(`stop`,{offset:`.540305`,stopColor:`#ff473f`}),(0,Z.jsx)(`stop`,{offset:`.6993464`,stopColor:`#ff5138`}),(0,Z.jsx)(`stop`,{offset:`.7712418`,stopColor:`#ff5b33`}),(0,Z.jsx)(`stop`,{offset:`.8605665`,stopColor:`#ff6c29`}),(0,Z.jsx)(`stop`,{offset:`1`,stopColor:`#ff8c18`})]}),(0,Z.jsxs)(`linearGradient`,{id:`google-btn-d`,children:[(0,Z.jsx)(`stop`,{offset:`.4084578`,stopColor:`#fb4e5a`}),(0,Z.jsx)(`stop`,{offset:`1`,stopColor:`#ff4540`})]}),(0,Z.jsxs)(`linearGradient`,{id:`google-btn-c`,children:[(0,Z.jsx)(`stop`,{offset:`.1315461`,stopColor:`#0cba65`}),(0,Z.jsx)(`stop`,{offset:`.2097843`,stopColor:`#0bb86d`}),(0,Z.jsx)(`stop`,{offset:`.2972969`,stopColor:`#09b479`}),(0,Z.jsx)(`stop`,{offset:`.3962575`,stopColor:`#08ad93`}),(0,Z.jsx)(`stop`,{offset:`.4771242`,stopColor:`#0aa6a9`}),(0,Z.jsx)(`stop`,{offset:`.5684245`,stopColor:`#0d9cc6`}),(0,Z.jsx)(`stop`,{offset:`.667385`,stopColor:`#1893dd`}),(0,Z.jsx)(`stop`,{offset:`.7687273`,stopColor:`#258bf1`}),(0,Z.jsx)(`stop`,{offset:`.8585063`,stopColor:`#3086ff`})]}),(0,Z.jsxs)(`linearGradient`,{id:`google-btn-e`,children:[(0,Z.jsx)(`stop`,{offset:`.3660131`,stopColor:`#ff4e3a`}),(0,Z.jsx)(`stop`,{offset:`.4575163`,stopColor:`#ff8a1b`}),(0,Z.jsx)(`stop`,{offset:`.540305`,stopColor:`#ffa312`}),(0,Z.jsx)(`stop`,{offset:`.6156363`,stopColor:`#ffb60c`}),(0,Z.jsx)(`stop`,{offset:`.7712418`,stopColor:`#ffcd0a`}),(0,Z.jsx)(`stop`,{offset:`.8605665`,stopColor:`#fecf0a`}),(0,Z.jsx)(`stop`,{offset:`.9150327`,stopColor:`#fecf08`}),(0,Z.jsx)(`stop`,{offset:`1`,stopColor:`#fdcd01`})]}),(0,Z.jsx)(`linearGradient`,{href:`#google-btn-a`,id:`google-btn-s`,x1:`219.6997`,y1:`329.5351`,x2:`254.4673`,y2:`329.5351`,gradientUnits:`userSpaceOnUse`}),(0,Z.jsx)(`radialGradient`,{href:`#google-btn-b`,id:`google-btn-m`,gradientUnits:`userSpaceOnUse`,gradientTransform:`matrix(-1.936885,1.043001,1.455731,2.555422,290.5254,-400.6338)`,cx:`109.6267`,cy:`135.8619`,fx:`109.6267`,fy:`135.8619`,r:`71.46001`}),(0,Z.jsx)(`radialGradient`,{href:`#google-btn-c`,id:`google-btn-n`,gradientUnits:`userSpaceOnUse`,gradientTransform:`matrix(-3.512595,-4.45809,-1.692547,1.260616,870.8006,191.554)`,cx:`45.25866`,cy:`279.2738`,fx:`45.25866`,fy:`279.2738`,r:`71.46001`}),(0,Z.jsx)(`radialGradient`,{href:`#google-btn-d`,id:`google-btn-l`,cx:`304.0166`,cy:`118.0089`,fx:`304.0166`,fy:`118.0089`,r:`47.85445`,gradientTransform:`matrix(2.064353,-4.926832e-6,-2.901531e-6,2.592041,-297.6788,-151.7469)`,gradientUnits:`userSpaceOnUse`}),(0,Z.jsx)(`radialGradient`,{href:`#google-btn-e`,id:`google-btn-o`,gradientUnits:`userSpaceOnUse`,gradientTransform:`matrix(-0.2485783,2.083138,2.962486,0.3341668,-255.1463,-331.1636)`,cx:`181.001`,cy:`177.2013`,fx:`181.001`,fy:`177.2013`,r:`71.46001`}),(0,Z.jsx)(`radialGradient`,{href:`#google-btn-f`,id:`google-btn-p`,cx:`207.6733`,cy:`108.0972`,fx:`207.6733`,fy:`108.0972`,r:`41.1025`,gradientTransform:`matrix(-1.249206,1.343263,-3.896837,-3.425693,880.5011,194.9051)`,gradientUnits:`userSpaceOnUse`}),(0,Z.jsx)(`radialGradient`,{href:`#google-btn-g`,id:`google-btn-r`,gradientUnits:`userSpaceOnUse`,gradientTransform:`matrix(-1.936885,-1.043001,1.455731,-2.555422,290.5254,838.6834)`,cx:`109.6267`,cy:`135.8619`,fx:`109.6267`,fy:`135.8619`,r:`71.46001`}),(0,Z.jsx)(`radialGradient`,{href:`#google-btn-h`,id:`google-btn-j`,gradientUnits:`userSpaceOnUse`,gradientTransform:`matrix(-0.081402,-1.93722,2.926737,-0.1162508,-215.1345,632.8606)`,cx:`154.8697`,cy:`145.9691`,fx:`154.8697`,fy:`145.9691`,r:`71.46001`}),(0,Z.jsx)(`filter`,{id:`google-btn-q`,x:`-.04842873`,y:`-.0582241`,width:`1.096857`,height:`1.116448`,colorInterpolationFilters:`sRGB`,children:(0,Z.jsx)(`feGaussianBlur`,{stdDeviation:`1.700914`})}),(0,Z.jsx)(`filter`,{id:`google-btn-k`,x:`-.01670084`,y:`-.01009856`,width:`1.033402`,height:`1.020197`,colorInterpolationFilters:`sRGB`,children:(0,Z.jsx)(`feGaussianBlur`,{stdDeviation:`.2419367`})}),(0,Z.jsx)(`clipPath`,{clipPathUnits:`userSpaceOnUse`,id:`google-btn-i`,children:(0,Z.jsx)(`path`,{d:`M371.3784 193.2406H237.0825v53.4375h77.167c-1.2405 7.5627-4.0259 15.0024-8.1049 21.7862-4.6734 7.7723-10.4511 13.6895-16.373 18.1957-17.7389 13.4983-38.42 16.2584-52.7828 16.2584-36.2824 0-67.2833-23.2865-79.2844-54.9287-.4843-1.1482-.8059-2.3344-1.1975-3.5068-2.652-8.0533-4.101-16.5825-4.101-25.4474 0-9.226 1.5691-18.0575 4.4301-26.3985 11.2851-32.8967 42.9849-57.4674 80.1789-57.4674 7.4811 0 14.6854.8843 21.5173 2.6481 15.6135 4.0309 26.6578 11.9698 33.4252 18.2494l40.834-39.7111c-24.839-22.616-57.2194-36.3201-95.8444-36.3201-30.8782-.00066-59.3863 9.55308-82.7477 25.6992-18.9454 13.0941-34.4833 30.6254-44.9695 50.9861-9.75366 18.8785-15.09441 39.7994-15.09441 62.2934 0 22.495 5.34891 43.6334 15.10261 62.3374v.126c10.3023 19.8567 25.3678 36.9537 43.6783 49.9878 15.9962 11.3866 44.6789 26.5516 84.0307 26.5516 22.6301 0 42.6867-4.0517 60.3748-11.6447 12.76-5.4775 24.0655-12.6217 34.3012-21.8036 13.5247-12.1323 24.1168-27.1388 31.3465-44.4041 7.2297-17.2654 11.097-36.7895 11.097-57.957 0-9.858-.9971-19.8694-2.6881-28.9684Z`,fill:`#000`})})]}),(0,Z.jsx)(`g`,{transform:`matrix(0.957922,0,0,0.985255,-90.17436,-78.85577)`,children:(0,Z.jsxs)(`g`,{clipPath:`url(#google-btn-i)`,children:[(0,Z.jsx)(`path`,{d:`M92.07563 219.9585c.14844 22.14 6.5014 44.983 16.11767 63.4234v.1269c6.9482 13.3919 16.4444 23.9704 27.2604 34.4518l65.326-23.67c-12.3593-6.2344-14.2452-10.0546-23.1048-17.0253-9.0537-9.0658-15.8015-19.4735-20.0038-31.677h-.1693l.1693-.1269c-2.7646-8.0587-3.0373-16.6129-3.1393-25.5029Z`,fill:`url(#google-btn-j)`,filter:`url(#google-btn-k)`}),(0,Z.jsx)(`path`,{d:`M237.0835 79.02491c-6.4568 22.52569-3.988 44.42139 0 57.16129 7.4561.0055 14.6388.8881 21.4494 2.6464 15.6135 4.0309 26.6566 11.97 33.424 18.2496l41.8794-40.7256c-24.8094-22.58904-54.6663-37.2961-96.7528-37.33169Z`,fill:`url(#google-btn-l)`,filter:`url(#google-btn-k)`}),(0,Z.jsx)(`path`,{d:`M236.9434 78.84678c-31.6709-.00068-60.9107 9.79833-84.8718 26.35902-8.8968 6.149-17.0612 13.2521-24.3311 21.1509-1.9045 17.7429 14.2569 39.5507 46.2615 39.3702 15.5284-17.9373 38.4946-29.5427 64.0561-29.5427.0233 0 .046.0019.0693.002l-1.0439-57.33536c-.0472-.00003-.0929-.00406-.1401-.00406Z`,fill:`url(#google-btn-m)`,filter:`url(#google-btn-k)`}),(0,Z.jsx)(`path`,{d:`m341.4751 226.3788-28.2685 19.2848c-1.2405 7.5627-4.0278 15.0023-8.1068 21.7861-4.6734 7.7723-10.4506 13.6898-16.3725 18.196-17.7022 13.4704-38.3286 16.2439-52.6877 16.2553-14.8415 25.1018-17.4435 37.6749 1.0439 57.9342 22.8762-.0167 43.157-4.1174 61.0458-11.7965 12.9312-5.551 24.3879-12.7913 34.7609-22.0964 13.7061-12.295 24.4421-27.5034 31.7688-45.0003 7.3267-17.497 11.2446-37.2822 11.2446-58.7336Z`,fill:`url(#google-btn-n)`,filter:`url(#google-btn-k)`}),(0,Z.jsx)(`path`,{d:`M234.9956 191.2104v57.4981h136.0062c1.1962-7.8745 5.1523-18.0644 5.1523-26.5001 0-9.858-.9963-21.899-2.6873-30.998Z`,fill:`#3086ff`,filter:`url(#google-btn-k)`}),(0,Z.jsx)(`path`,{d:`M128.3894 124.3268c-8.393 9.1191-15.5632 19.326-21.2483 30.3646-9.75351 18.8785-15.09402 41.8295-15.09402 64.3235 0 .317.02642.6271.02855.9436 4.31953 8.2244 59.66647 6.6495 62.45617 0-.0035-.3103-.0387-.6128-.0387-.9238 0-9.226 1.5696-16.0262 4.4306-24.3672 3.5294-10.2885 9.0557-19.7628 16.1223-27.9257 1.6019-2.0309 5.8748-6.3969 7.1214-9.0157.4749-.9975-.8621-1.5574-.9369-1.9085-.0836-.3927-1.8762-.0769-2.2778-.3694-1.2751-.9288-3.8001-1.4138-5.3334-1.8449-3.2772-.9215-8.7085-2.9536-11.7252-5.0601-9.5357-6.6586-24.417-14.6122-33.5047-24.2164Z`,fill:`url(#google-btn-o)`,filter:`url(#google-btn-k)`}),(0,Z.jsx)(`path`,{d:`M162.0989 155.8569c22.1123 13.3013 28.4714-6.7139 43.173-12.9771L179.698 90.21568c-9.4075 3.92642-18.2957 8.80465-26.5426 14.50442-12.316 8.5122-23.192 18.8995-32.1763 30.7204Z`,fill:`url(#google-btn-p)`,filter:`url(#google-btn-q)`}),(0,Z.jsx)(`path`,{d:`M171.0987 290.222c-29.6829 10.6413-34.3299 11.023-37.0622 29.2903 5.2213 5.0597 10.8312 9.74 16.7926 13.9835 15.9962 11.3867 46.766 26.5517 86.1178 26.5517.0462 0 .0904-.004.1366-.004v-59.1574c-.0298.0001-.064.002-.0938.002-14.7359 0-26.5113-3.8435-38.5848-10.5273-2.9768-1.6479-8.3775 2.7772-11.1229.799-3.7865-2.7284-12.8991 2.3508-16.1833-.9378Z`,fill:`url(#google-btn-r)`,filter:`url(#google-btn-k)`}),(0,Z.jsx)(`path`,{d:`M219.6997 299.0227v59.9959c5.506.6402 11.2361 1.0289 17.2472 1.0289 6.0259 0 11.8556-.3073 17.5204-.8723v-59.7481c-6.3482 1.0777-12.3272 1.461-17.4776 1.461-5.9318 0-11.7005-.6858-17.29-1.8654Z`,opacity:`.5`,fill:`url(#google-btn-s)`,filter:`url(#google-btn-k)`})]})})]}),rn=({isLoading:e,preferences:t,children:n,...r})=>{let{t:i}=ht(t?.i18n);return(0,Z.jsx)(jt,{...r,fullWidth:!0,type:`button`,color:`secondary`,variant:`solid`,disabled:e,startIcon:(0,Z.jsx)(nn,{}),children:n??i(`elements.buttons.google.text`)})},an=({isLoading:e,preferences:t,children:n,...r})=>{let{t:i}=ht(t?.i18n);return(0,Z.jsx)(jt,{...r,fullWidth:!0,type:`button`,color:`secondary`,variant:`solid`,disabled:e,startIcon:(0,Z.jsx)(`svg`,{width:`18`,height:`18`,viewBox:`0 0 24 24`,xmlns:`http://www.w3.org/2000/svg`,children:(0,Z.jsx)(`path`,{fill:`#0077B5`,d:`M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z`})}),children:n??i(`elements.buttons.linkedin.text`)})},on=({isLoading:e,preferences:t,children:n,...r})=>{let{t:i}=ht(t?.i18n);return(0,Z.jsx)(jt,{...r,fullWidth:!0,type:`button`,color:`secondary`,variant:`solid`,disabled:e,startIcon:(0,Z.jsxs)(`svg`,{width:`14`,height:`14`,viewBox:`0 0 23 23`,xmlns:`http://www.w3.org/2000/svg`,children:[(0,Z.jsx)(`path`,{fill:`#f3f3f3`,d:`M0 0h23v23H0z`}),(0,Z.jsx)(`path`,{fill:`#f35325`,d:`M1 1h10v10H1z`}),(0,Z.jsx)(`path`,{fill:`#81bc06`,d:`M12 1h10v10H12z`}),(0,Z.jsx)(`path`,{fill:`#05a6f0`,d:`M1 12h10v10H1z`}),(0,Z.jsx)(`path`,{fill:`#ffba08`,d:`M12 12h10v10H12z`})]}),children:n??i(`elements.buttons.microsoft.text`)})},sn=({isLoading:e,preferences:t,children:n,...r})=>{let{t:i}=ht(t?.i18n);return(0,Z.jsx)(jt,{...r,fullWidth:!0,type:`button`,color:`secondary`,variant:`solid`,disabled:e,startIcon:(0,Z.jsx)(`svg`,{width:`18`,height:`18`,viewBox:`0 0 24 24`,xmlns:`http://www.w3.org/2000/svg`,children:(0,Z.jsx)(`path`,{fill:`#627EEA`,d:`M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z`})}),children:n??i(`elements.buttons.ethereum.text`)})},cn=(e,t,n,r)=>(0,X.useMemo)(()=>{let t=q`
      display: flex;
      align-items: center;
    `,i=q`
      width: calc(${e.vars.spacing.unit} * 2.5);
      height: calc(${e.vars.spacing.unit} * 2.5);
      margin-inline-end: ${e.vars.spacing.unit};
      accent-color: ${e.vars.colors.primary.main};
      cursor: pointer;

      &:focus {
        outline: 2px solid ${e.vars.colors.primary.main};
        outline-offset: 2px;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
    `,a=q`
      accent-color: ${e.vars.colors.error.main};

      &:focus {
        outline-color: ${e.vars.colors.error.main};
      }
    `,o=q`
      color: ${e.vars.colors.text.primary};
      font-size: ${e.vars.typography.fontSizes.sm};
      font-family: ${e.vars.typography.fontFamily};
      cursor: pointer;

      &:hover {
        color: ${e.vars.colors.text.primary};
      }
    `,s=q`
      color: ${e.vars.colors.error.main};
    `,c=q`
      /* Required indicator styles will be handled by InputLabel */
    `;return{container:t,errorInput:n?a:``,errorLabel:n?s:``,input:i,label:o,required:r?c:``}},[e,t,n,r]),ln=({label:e,error:t,className:n,required:r,helperText:i,style:a={},...o})=>{let{theme:s,colorScheme:c}=J(),l=!!t,u=cn(s,c,l,!!r);return(0,Z.jsx)(Ee,{error:t,helperText:i,className:Y(M(b(`checkbox`)),n),helperTextMarginLeft:`calc(${s.vars.spacing.unit} * 3.5)`,children:(0,Z.jsxs)(`div`,{style:a,className:Y(M(b(`checkbox`,`container`)),u.container),children:[(0,Z.jsx)(`input`,{type:`checkbox`,className:Y(M(b(`checkbox`,`input`)),u.input,u.errorInput,{[M(b(`checkbox`,`input`,`error`))]:l}),"aria-invalid":l,"aria-required":r,...o}),e&&(0,Z.jsx)(Se,{required:r,error:l,variant:`inline`,className:Y(M(b(`checkbox`,`label`)),u.label,u.errorLabel,{[M(b(`checkbox`,`label`,`error`))]:l}),children:e})]})})},un=(e,t,n,r)=>(0,X.useMemo)(()=>{let t=q`
      width: 100%;
      padding: ${e.vars.spacing.unit} calc(${e.vars.spacing.unit} * 1.5);
      border: 1px solid ${e.vars.colors.border};
      border-radius: ${e.vars.components?.Field?.root?.borderRadius||e.vars.borderRadius.medium};
      font-size: 1rem;
      font-family: ${e.vars.typography.fontFamily};
      color: ${e.vars.colors.text.primary};
      background-color: ${e.vars.colors.background.surface};
      outline: none;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;

      &:focus {
        border-color: ${e.vars.colors.primary.main};
        box-shadow: 0 0 0 2px ${e.vars.colors.primary.main}20;
      }

      &:hover:not(:disabled) {
        border-color: ${e.vars.colors.primary.main};
      }

      &::placeholder {
        color: ${e.vars.colors.text.secondary};
      }
    `,i=q`
      border-color: ${e.vars.colors.error.main};

      &:focus {
        border-color: ${e.vars.colors.error.main};
        box-shadow: 0 0 0 2px ${e.vars.colors.error.main}20;
      }

      &:hover:not(:disabled) {
        border-color: ${e.vars.colors.error.main};
      }
    `,a=q`
      background-color: ${e.vars.colors.background.disabled};
      color: ${e.vars.colors.text.secondary};
      cursor: not-allowed;
      opacity: 0.6;

      &:hover,
      &:focus {
        border-color: ${e.vars.colors.border};
        box-shadow: none;
      }
    `,o=q`
      /* Label styles will be handled by InputLabel component */
    `;return{disabledInput:r?a:``,errorInput:n?i:``,input:t,label:o}},[e,t,n,r]),dn=({label:e,error:t,className:n,required:r,disabled:i,helperText:a,dateFormat:o=`yyyy-MM-dd`,style:s={},...c})=>{let{theme:l,colorScheme:u}=J(),d=!!t,f=un(l,u,d,!!i);return(0,Z.jsxs)(Ee,{error:t,helperText:a,className:Y(M(b(`date-picker`)),n),style:s,children:[e&&(0,Z.jsx)(Se,{required:r,error:d,className:Y(M(b(`date-picker`,`label`)),f.label),children:e}),(0,Z.jsx)(`input`,{type:`date`,pattern:`\\d{4}-\\d{2}-\\d{2}`,placeholder:o,className:Y(M(b(`date-picker`,`input`)),f.input,f.errorInput,f.disabledInput,{[M(b(`date-picker`,`input`,`error`))]:d,[M(b(`date-picker`,`input`,`disabled`))]:i}),disabled:i,"aria-invalid":d,"aria-required":r,...c})]})},fn=(e,t,n,r,i)=>(0,X.useMemo)(()=>{let t=q`
      display: flex;
      gap: ${e.vars.spacing.unit};
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
    `,i=q`
      width: calc(${e.vars.spacing.unit} * 6);
      height: calc(${e.vars.spacing.unit} * 6);
      text-align: center;
      font-size: ${e.vars.typography.fontSizes.xl};
      font-family: ${e.vars.typography.fontFamily};
      font-weight: 500;
      border: 2px solid ${r?e.vars.colors.error.main:e.vars.colors.border};
      border-radius: ${e.vars.components?.Field?.root?.borderRadius||e.vars.borderRadius.medium};
      color: ${e.vars.colors.text.primary};
      background-color: ${n?e.vars.colors.background.disabled:e.vars.colors.background.surface};
      outline: none;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;

      &:focus {
        border-color: ${r?e.vars.colors.error.main:e.vars.colors.primary.main};
        box-shadow: 0 0 0 2px ${r?`${e.vars.colors.error.main}20`:`${e.vars.colors.primary.main}20`};
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      &::placeholder {
        color: ${e.vars.colors.text.secondary};
        opacity: 0.7;
      }
    `,a=q`
      border-color: ${e.vars.colors.error.main};

      &:focus {
        border-color: ${e.vars.colors.error.main};
        box-shadow: 0 0 0 2px ${e.vars.colors.error.main}20;
      }
    `;return{input:i,inputContainer:t,inputDisabled:q`
      background-color: ${e.vars.colors.background.disabled};
      cursor: not-allowed;
      opacity: 0.6;
    `,inputError:a}},[e,t,n,r,i]),pn=({label:e,error:t,className:n,required:r,disabled:i,helperText:a,length:o=6,value:s=``,onChange:c,onComplete:l,type:u=`text`,placeholder:d=``,style:f={},autoFocus:p=!1,pattern:m,uppercase:h=!1})=>{let{theme:g,colorScheme:_}=J(),v=fn(g,_,!!i,!!t,o),[y,x]=(0,X.useState)(Array(o).fill(``)),S=(0,X.useRef)([]);(0,X.useEffect)(()=>{S.current=S.current.slice(0,o)},[o]),(0,X.useEffect)(()=>{if(s){let e=s.split(``).slice(0,o);for(;e.length<o;)e.push(``);x(e)}else x(Array(o).fill(``))},[s,o]),(0,X.useEffect)(()=>{p&&S.current[0]&&S.current[0].focus()},[p]);let C=(e,t)=>{let n=h?t.target.value.toUpperCase():t.target.value;if(n.length>1||u===`number`&&n&&!/^\d$/.test(n)||m&&n&&!new RegExp(m).test(n))return;let r=[...y];r[e]=n,x(r);let i=r.join(``);c?.({target:{value:i}}),n&&e<o-1&&S.current[e+1]?.focus(),r.every(e=>e!==``)&&l&&l(i)},w=(e,t)=>{if(t.key===`Backspace`){if(!y[e]&&e>0){let t=[...y];t[e-1]=``,x(t),S.current[e-1]?.focus(),c?.({target:{value:t.join(``)}})}else if(y[e]){let t=[...y];t[e]=``,x(t),c?.({target:{value:t.join(``)}})}}else t.key===`ArrowLeft`&&e>0?S.current[e-1]?.focus():t.key===`ArrowRight`&&e<o-1?S.current[e+1]?.focus():t.key===`Enter`&&(t.preventDefault(),y.every(e=>e!==``)&&l&&l(y.join(``)))},T=e=>{e.preventDefault();let t=e.clipboardData.getData(`text`),n=h?t.toUpperCase():t,r=``;Array.from(n).forEach(e=>{u===`number`&&!/^\d$/.test(e)||m&&!new RegExp(m).test(e)||(r+=e)});let i=Array(o).fill(``);for(let e=0;e<Math.min(r.length,o);e+=1)i[e]=r[e];x(i),c?.({target:{value:i.join(``)}});let a=i.findIndex(e=>e===``),s=a===-1?o-1:a;S.current[s]?.focus(),i.every(e=>e!==``)&&l&&l(i.join(``))};return(0,Z.jsxs)(Ee,{error:t,helperText:a,className:Y(M(b(`otp-field`)),n),helperTextAlign:`center`,style:f,children:[e&&(0,Z.jsx)(Se,{required:r,error:!!t,children:e}),(0,Z.jsx)(`div`,{className:Y(M(b(`otp-field`,`input-container`)),v.inputContainer),children:Array.from({length:o},(n,a)=>(0,Z.jsx)(`input`,{ref:e=>{e&&(S.current[a]=e)},type:u===`password`?`password`:`text`,inputMode:u===`number`?`numeric`:`text`,value:y[a]||``,onChange:e=>C(a,e),onKeyDown:e=>w(a,e),onPaste:T,className:Y(M(b(`otp-field`,`input`)),v.input,{[M(b(`otp-field`,`input`,`error`))]:!!t,[v.inputError]:!!t,[M(b(`otp-field`,`input`,`disabled`))]:!!i,[v.inputDisabled]:!!i}),maxLength:1,placeholder:d,disabled:i,"aria-label":`${e||`OTP`} digit ${a+1}`,"aria-invalid":!!t,"aria-required":r,autoComplete:`one-time-code`},a))})]})},mn=(e,t,n,r,i,a)=>(0,X.useMemo)(()=>{let t=i?`calc(${e.vars.spacing.unit} * 5)`:`calc(${e.vars.spacing.unit} * 1.5)`,o=a?`calc(${e.vars.spacing.unit} * 5)`:`calc(${e.vars.spacing.unit} * 1.5)`,s=q`
      position: relative;
      display: flex;
      align-items: center;
    `,c=q`
      width: 100%;
      padding-block: ${e.vars.spacing.unit};
      padding-inline-start: ${t};
      padding-inline-end: ${o};
      border: 1px solid ${r?e.vars.colors.error.main:e.vars.colors.border};
      border-radius: ${e.vars.components?.Field?.root?.borderRadius||e.vars.borderRadius.medium};
      font-size: ${e.vars.typography.fontSizes.md};
      font-family: ${e.vars.typography.fontFamily};
      color: ${e.vars.colors.text.primary};
      background-color: ${n?e.vars.colors.background.disabled:e.vars.colors.background.surface};
      outline: none;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;

      &:focus {
        border-color: ${r?e.vars.colors.error.main:e.vars.colors.primary.main};
        box-shadow: 0 0 0 2px ${r?`${e.vars.colors.error.main}20`:`${e.vars.colors.primary.main}20`};
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        border-color: ${r?e.vars.colors.error.main:e.vars.colors.primary.main};
      }

      &::placeholder {
        color: ${e.vars.colors.text.secondary};
        opacity: 0.7;
      }
    `,l=q`
      border-color: ${e.vars.colors.error.main};

      &:focus {
        border-color: ${e.vars.colors.error.main};
        box-shadow: 0 0 0 2px ${e.vars.colors.error.main}20;
      }

      &:hover:not(:disabled) {
        border-color: ${e.vars.colors.error.main};
      }
    `,u=q`
      background-color: ${e.vars.colors.background.disabled};
      opacity: 0.6;
      cursor: not-allowed;
    `,d=q`
      position: absolute;
      background: none;
      border: none;
      cursor: ${n?`not-allowed`:`pointer`};
      padding: calc(${e.vars.spacing.unit} / 2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${e.vars.colors.text.secondary};
      opacity: ${n?.5:1};
      top: 50%;
      transform: translateY(-50%);
      transition:
        color 0.2s ease,
        opacity 0.2s ease;

      &:hover:not(:disabled) {
        color: ${e.vars.colors.text.primary};
      }

      &:focus {
        outline: 2px solid ${e.vars.colors.primary.main};
        outline-offset: 2px;
      }
    `,f=q`
      ${d};
      inset-inline-start: ${e.vars.spacing.unit};
    `;return{endIcon:q`
      ${d};
      inset-inline-end: ${e.vars.spacing.unit};
    `,icon:d,input:c,inputContainer:s,inputDisabled:u,inputError:l,startIcon:f}},[e,t,n,r,i,a]),hn=({label:e,error:t,required:n,className:r,disabled:i,helperText:a,startIcon:o,endIcon:s,onStartIconClick:c,onEndIconClick:l,type:u=`text`,style:d={},...f})=>{let{theme:p,colorScheme:m}=J(),h=!!t,g=mn(p,m,i??!1,h,!!o,!!s),_=Y(M(b(`text-field`,`input`)),g.input,h&&g.inputError,i&&g.inputDisabled),v=Y(M(b(`text-field`,`container`)),g.inputContainer),y=Y(M(b(`text-field`,`start-icon`)),g.startIcon),x=Y(M(b(`text-field`,`end-icon`)),g.endIcon);return(0,Z.jsxs)(Ee,{error:t,helperText:a,className:Y(M(b(`text-field`)),r),style:d,children:[e&&(0,Z.jsx)(Se,{required:n,error:h,children:e}),(0,Z.jsxs)(`div`,{className:v,children:[o&&(0,Z.jsx)(`div`,{className:y,onClick:c,role:c?`button`:void 0,tabIndex:c&&!i?0:void 0,"aria-label":`Start icon`,children:o}),(0,Z.jsx)(`input`,{className:_,type:u,disabled:i,"aria-invalid":h,"aria-required":n,...f}),s&&(0,Z.jsx)(`div`,{className:x,onClick:l,role:l?`button`:void 0,tabIndex:l&&!i?0:void 0,"aria-label":`End icon`,children:s})]})]})},gn=(e,t,n,r,i)=>(0,X.useMemo)(()=>{let t=q`
      cursor: ${r?`not-allowed`:`pointer`};
      color: ${e.vars.colors.text.secondary};
      opacity: ${r?.6:1};
      transition: color 0.2s ease;

      &:hover {
        color: ${r?e.vars.colors.text.secondary:e.vars.colors.text.primary};
      }
    `,n=q`
      color: ${e.vars.colors.primary.main};
    `;return{hiddenIcon:q`
      color: ${e.vars.colors.text.secondary};
    `,toggleIcon:t,visibleIcon:n}},[e,t,n,r,i]),_n=({onChange:e,className:t,disabled:n,error:r,...i})=>{let{theme:a,colorScheme:o}=J(),[s,c]=(0,X.useState)(!1),l=gn(a,o,s,!!n,!!r),u=()=>{n||c(!s)},d=s?$t:Qt;return(0,Z.jsx)(hn,{...i,className:Y(M(b(`password-field`)),t),type:s?`text`:`password`,onChange:t=>e(t.target.value),autoComplete:`current-password`,disabled:n,error:r,endIcon:(0,Z.jsx)(d,{width:16,height:16,className:Y(M(b(`password-field`,`toggle-icon`)),l.toggleIcon,s?l.visibleIcon:l.hiddenIcon)}),onEndIconClick:u})},vn=(e,t,n,r)=>(0,X.useMemo)(()=>{let t=`data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23${e.colors.text.secondary.replace(`#`,``)}%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E`,i=q`
      width: 100%;
      padding: ${e.vars.spacing.unit} calc(${e.vars.spacing.unit} * 1.5);
      border: 1px solid ${r?e.vars.colors.error.main:e.vars.colors.border};
      border-radius: ${e.vars.components?.Field?.root?.borderRadius||e.vars.borderRadius.medium};
      font-size: ${e.vars.typography.fontSizes.md};
      font-family: ${e.vars.typography.fontFamily};
      color: ${e.vars.colors.text.primary};
      background-color: ${n?e.vars.colors.background.disabled:e.vars.colors.background.surface};
      outline: none;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
      appearance: none;
      background-image: url('${t}');
      background-repeat: no-repeat;
      background-position: right 0.7em top 50%;
      background-size: 0.65em auto;
      cursor: ${n?`not-allowed`:`pointer`};

      &:focus {
        border-color: ${r?e.vars.colors.error.main:e.vars.colors.primary.main};
        box-shadow: 0 0 0 2px ${r?`${e.vars.colors.error.main}20`:`${e.vars.colors.primary.main}20`};
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        border-color: ${r?e.vars.colors.error.main:e.vars.colors.primary.main};
      }
    `,a=q`
      border-color: ${e.vars.colors.error.main};

      &:focus {
        border-color: ${e.vars.colors.error.main};
        box-shadow: 0 0 0 2px ${e.vars.colors.error.main}20;
      }

      &:hover:not(:disabled) {
        border-color: ${e.vars.colors.error.main};
      }
    `,o=q`
      background-color: ${e.vars.colors.background.disabled};
      opacity: 0.6;
      cursor: not-allowed;
    `;return{option:q`
      padding: calc(${e.vars.spacing.unit} / 2) ${e.vars.spacing.unit};
      color: ${e.vars.colors.text.primary};
      background-color: ${e.vars.colors.background.surface};

      &:hover {
        background-color: ${e.vars.colors.action.hover};
      }

      &:checked {
        background-color: ${e.vars.colors.primary.main};
        color: ${e.vars.colors.primary.contrastText};
      }
    `,select:i,selectDisabled:o,selectError:a}},[e,t,n,r]),yn=({label:e,error:t,className:n,required:r,disabled:i,helperText:a,placeholder:o,options:s,style:c={},...l})=>{let{theme:u,colorScheme:d}=J(),f=!!t,p=vn(u,d,i??!1,f),m=Y(M(b(`select`,`input`)),p.select,f&&p.selectError,i&&p.selectDisabled);return(0,Z.jsxs)(Ee,{error:t,helperText:a,className:Y(M(b(`select`)),n),style:c,children:[e&&(0,Z.jsx)(Se,{required:r,error:f,children:e}),(0,Z.jsxs)(`select`,{className:m,disabled:i,"aria-invalid":f,"aria-required":r,...l,children:[o&&(0,Z.jsx)(`option`,{value:``,disabled:!0,children:o}),s.map(e=>(0,Z.jsx)(`option`,{value:e.value,className:p.option,children:e.label},e.value))]})]})},bn=(e,t,n=!1,r=!1)=>{if(n&&r&&(!e||e.trim()===``))return`This field is required`;if(!e||e.trim()===``)return null;switch(t){case G.Number:{let t=parseInt(e,10);if(Number.isNaN(t))return`Please enter a valid number`;break}default:break}return null},xn=e=>{let{name:t,type:n,label:r,required:i,value:a,onChange:o,onBlur:s,disabled:c=!1,error:l,className:u,id:d,options:f=[],touched:p=!1,placeholder:m,length:h,numericOnly:g=!0}=e,_=l||bn(a,n,i,p),v={className:u,"data-testid":`thunderid-signin-${t}`,disabled:c,error:_,id:d,label:r,name:t,onBlur:s,placeholder:m,required:i,value:a};switch(n){case G.Password:return(0,Z.jsx)(_n,{...v,onChange:o});case G.Text:return(0,Z.jsx)(hn,{...v,type:`text`,onChange:e=>o(e.target.value),autoComplete:`off`});case G.Email:return(0,Z.jsx)(hn,{...v,type:`email`,onChange:e=>o(e.target.value),autoComplete:`email`});case G.Tel:return(0,Z.jsx)(hn,{...v,type:`tel`,onChange:e=>o(e.target.value),autoComplete:`tel`});case G.Date:return(0,Z.jsx)(dn,{...v,onChange:e=>o(e.target.value)});case G.Checkbox:{let e=a===`true`||a===!0;return(0,Z.jsx)(ln,{...v,checked:e,onChange:e=>o(e.target.checked.toString())})}case G.Otp:return(0,Z.jsx)(pn,{...v,length:h,type:g?`number`:`text`,uppercase:!g,onChange:e=>o(e.target.value)});case G.Number:return(0,Z.jsx)(hn,{...v,type:`number`,onChange:e=>o(e.target.value),helperText:`Enter a numeric value`});case G.Select:{let e=f.length>0?f:[];return e.length>0?(0,Z.jsx)(yn,{...v,options:e,onChange:e=>o(e.target.value),helperText:`Select from available options`}):(0,Z.jsx)(hn,{...v,type:`text`,onChange:e=>o(e.target.value),helperText:`Enter multiple values separated by commas (e.g., value1, value2, value3)`,placeholder:`value1, value2, value3`})}default:return(0,Z.jsx)(hn,{...v,type:`text`,onChange:e=>o(e.target.value),helperText:`Unknown field type, treating as text`})}},Sn=(e,t,n,r,i,a)=>(0,X.useMemo)(()=>{let t=i||e.colors.border,n;n=r===`solid`?`solid`:r===`dashed`?`dashed`:`dotted`;let o=q`
      margin: calc(${e.vars.spacing.unit} * 2) 0;
    `,s=q`
      display: inline-block;
      height: 100%;
      min-height: calc(${e.vars.spacing.unit} * 2);
      width: 1px;
      border-inline-start: 1px ${n} ${t};
      margin-block: 0;
      margin-inline: calc(${e.vars.spacing.unit} * 1);
    `;return{divider:o,horizontal:q`
      display: flex;
      align-items: center;
      width: 100%;
      ${!a&&q`
        height: 1px;
        border-top: 1px ${n} ${t};
      `}
    `,line:q`
      flex: 1;
      height: 1px;
      border-top: 1px ${n} ${t};
    `,text:q`
      background-color: ${e.vars.colors.background.surface};
      font-family: ${e.vars.typography.fontFamily};
      padding: 0 calc(${e.vars.spacing.unit} * 1);
      white-space: nowrap;
    `,vertical:s}},[e,t,n,r,i,a]),Cn=({orientation:e=`horizontal`,variant:t=`solid`,children:n,color:r,className:i,style:a,...o})=>{let{theme:s,colorScheme:c}=J(),l=Sn(s,c,e,t,r,!!n);return e===`vertical`?(0,Z.jsx)(`div`,{className:Y(M(b(`divider`)),M(b(`divider`,`vertical`)),l.divider,l.vertical,i),style:a,role:`separator`,"aria-orientation":`vertical`,...o}):n?(0,Z.jsxs)(`div`,{className:Y(M(b(`divider`)),M(b(`divider`,`horizontal`)),M(b(`divider`,`with-text`)),l.divider,l.horizontal,i),style:a,role:`separator`,"aria-orientation":`horizontal`,...o,children:[(0,Z.jsx)(`div`,{className:Y(M(b(`divider`,`line`)),l.line)}),(0,Z.jsx)(je,{variant:`body2`,color:`textSecondary`,className:Y(M(b(`divider`,`text`)),l.text),inline:!0,children:n}),(0,Z.jsx)(`div`,{className:Y(M(b(`divider`,`line`)),l.line)})]}):(0,Z.jsx)(`div`,{className:Y(M(b(`divider`)),M(b(`divider`,`horizontal`)),l.divider,l.horizontal,i),style:a,role:`separator`,"aria-orientation":`horizontal`,...o})},wn=e=>`__${F(e)}_prefix__`,Tn=e=>`__${F(e)}_postfix__`,En=(e,t)=>`${wn(t)}${e}`,Dn=(e,t)=>`${Tn(t)}${e}`,On=`4em`,kn=({component:e})=>{let{theme:t}=J(),n=q({textAlign:`center`}),r=q({fontSize:`100cqmin`,lineHeight:1}),a=e.config||{},o=a.src||``,s=a.alt||a.label||`Image`,c=a.width||`100%`,l=a.height||`auto`,u=e.variant?.toLowerCase()||`image_block`,d={borderRadius:t.vars.borderRadius.small,display:`block`,margin:u===`image_block`?`1rem auto`:`0`},f=q(d);if(!o)return null;let p=i(o,s);if(p.kind===`emoji`){let t=e=>/^\d+(\.\d+)?$/.test(e)?`${e}px`:e,i=t(c),a=t(l),o=e=>e!==`auto`&&!e.endsWith(`%`),u;return u=o(a)?a:o(i)?i:On,(0,Z.jsx)(`div`,{className:n,children:(0,Z.jsx)(`span`,{className:q({...d,containerType:`size`,display:`inline-grid`,height:u,placeItems:`center`,width:i}),children:(0,Z.jsx)(`span`,{"aria-label":s,role:`img`,className:r,children:p.glyph})})},e.id)}return(0,Z.jsx)(`div`,{className:n,children:(0,Z.jsx)(`img`,{src:p.imgSrc,alt:s,height:l,width:c,className:f,onError:e=>{e.currentTarget.style.display=`none`}})},e.id)},An=({isLoading:e,preferences:t,children:n,...r})=>{let{t:i}=ht(t?.i18n);return(0,Z.jsx)(jt,{...r,fullWidth:!0,type:`button`,color:`secondary`,variant:`solid`,disabled:e,startIcon:(0,Z.jsx)(`svg`,{width:`18`,height:`18`,viewBox:`0 0 24 24`,xmlns:`http://www.w3.org/2000/svg`,children:(0,Z.jsx)(`path`,{fill:`currentColor`,d:`M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 0 0-1.02.24l-2.2 2.2a15.074 15.074 0 0 1-6.59-6.59l2.2-2.2c.27-.27.35-.67.24-1.02A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1M12 3v10l3-3h6V3z`})}),children:n??i(`elements.buttons.smsotp.text`)})},jn=e=>(0,X.useMemo)(()=>({container:q`
        display: flex;
        flex-direction: column;
        gap: calc(${e.vars.spacing.unit} * 0.5);
        width: 100%;
      `,copyButton:q`
        flex-shrink: 0;
        white-space: nowrap;
      `,label:q`
        color: ${e.vars.colors.text.secondary};
        font-size: 0.875rem;
        font-weight: 500;
      `,valueBox:q`
        align-items: center;
        background-color: ${e.vars.colors.background.surface};
        border: 1px solid ${e.vars.colors.border};
        border-radius: ${e.vars.borderRadius.small};
        display: flex;
        gap: calc(${e.vars.spacing.unit} * 1);
        padding: calc(${e.vars.spacing.unit} * 0.75) calc(${e.vars.spacing.unit} * 1);
      `,valueText:q`
        color: ${e.vars.colors.text.primary};
        flex: 1;
        font-family: monospace;
        font-size: 0.85rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        word-break: break-all;
      `}),[e]),Mn=({label:e,value:t})=>{let{theme:n}=J(),r=jn(n),{t:i}=ht(),[a,o]=(0,X.useState)(!1),s=(0,X.useCallback)(async()=>{try{await navigator.clipboard.writeText(t)}catch{let e=document.createElement(`textarea`);e.value=t,document.body.appendChild(e),e.select(),document.execCommand(`copy`),document.body.removeChild(e)}o(!0),setTimeout(()=>o(!1),3e3)},[t]);return(0,Z.jsxs)(`div`,{className:r.container,children:[e&&(0,Z.jsx)(`span`,{className:r.label,children:e}),(0,Z.jsxs)(`div`,{className:r.valueBox,children:[(0,Z.jsx)(`span`,{className:r.valueText,children:t}),(0,Z.jsx)(jt,{variant:`outline`,size:`small`,className:r.copyButton,onClick:()=>{s().catch(()=>void 0)},children:i(a?`elements.display.copyable_text.copied`:`elements.display.copyable_text.copy`)})]})]})},Nn=({color:e=`currentColor`,size:t=24})=>(0,Z.jsxs)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,width:t,height:t,viewBox:`0 0 24 24`,fill:`none`,stroke:e,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,children:[(0,Z.jsx)(`path`,{d:`M8 3 4 7l4 4`}),(0,Z.jsx)(`path`,{d:`M4 7h16`}),(0,Z.jsx)(`path`,{d:`m16 21 4-4-4-4`}),(0,Z.jsx)(`path`,{d:`M20 17H4`})]});Nn.displayName=`ArrowLeftRight`;var Pn=Nn,Fn=({color:e=`currentColor`,size:t=24})=>(0,Z.jsxs)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,width:t,height:t,viewBox:`0 0 24 24`,fill:`none`,stroke:e,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,children:[(0,Z.jsx)(`path`,{d:`m16 3 4 4-4 4`}),(0,Z.jsx)(`path`,{d:`M20 7H4`}),(0,Z.jsx)(`path`,{d:`m8 21-4-4 4-4`}),(0,Z.jsx)(`path`,{d:`M4 17h16`})]});Fn.displayName=`ArrowRightLeft`;var In={ArrowLeftRight:Pn,ArrowRightLeft:Fn},Ln=(e,t,n,r,i)=>(0,X.useMemo)(()=>{let t=r?e.vars.colors.error.main:e.vars.colors.border,a=r?e.vars.colors.error.main:e.vars.colors.primary.main,o=e.vars.components?.Field?.root?.borderRadius??e.vars.borderRadius.medium,s=q`
      position: relative;
      display: flex;
      align-items: stretch;
      width: 100%;
    `,c=q`
      flex: 1;
      min-width: 0;
      padding-block: ${e.vars.spacing.unit};
      padding-inline: calc(${e.vars.spacing.unit} * 1.5);
      border: 1px solid ${t};
      font-size: ${e.vars.typography.fontSizes.md};
      font-family: ${e.vars.typography.fontFamily};
      color: ${e.vars.colors.text.primary};
      background-color: ${n?e.vars.colors.background.disabled:e.vars.colors.background.surface};
      outline: none;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;

      &::placeholder {
        color: ${e.vars.colors.text.secondary};
        opacity: 0.7;
      }

      &:focus {
        border-color: ${a};
        box-shadow: 0 0 0 2px ${a}20;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        border-color: ${a};
      }
    `,l=i?q`
          ${c};
          border-start-start-radius: 0;
          border-end-start-radius: 0;
          border-start-end-radius: ${o};
          border-end-end-radius: ${o};
          border-inline-start: none;
        `:q`
          ${c};
          border-radius: ${o};
        `,u=q`
      display: flex;
      align-items: center;
      padding-inline: calc(${e.vars.spacing.unit} * 1.5);
      border: 1px solid ${t};
      border-start-start-radius: ${o};
      border-end-start-radius: ${o};
      background-color: ${e.vars.colors.background.surface};
      color: ${e.vars.colors.text.primary};
      font-size: ${e.vars.typography.fontSizes.md};
      font-family: ${e.vars.typography.fontFamily};
      white-space: nowrap;
    `,d=q`
      ${u};
      user-select: none;
      color: ${e.vars.colors.text.secondary};
    `;return{input:l,inputContainer:s,prefixSelect:q`
      ${u};
      cursor: pointer;
      appearance: auto;
      padding-inline-end: calc(${e.vars.spacing.unit} * 1.5);

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &:focus {
        outline: none;
        border-color: ${a};
        box-shadow: 0 0 0 2px ${a}20;
        z-index: 1;
      }
    `,prefixSpan:d,visuallyHidden:q`
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `}},[e,t,n,r,i]),Rn=e=>typeof e==`string`?e.length>0?[{label:e,value:e}]:[]:e??[],zn=({label:e,error:t,required:n,className:r,disabled:i,helperText:a,prefixes:o,prefixValue:s,onPrefixChange:c,type:l=`text`,style:u={},...d})=>{let{theme:f,colorScheme:p}=J(),m=!!t,h=Rn(o),g=h.length>0,_=h.length===1,v=Ln(f,p,i??!1,m,g),y=`${(0,X.useId)()}-prefix`,x=Y(M(b(`affixed-field`,`container`)),v.inputContainer),S=Y(M(b(`affixed-field`,`input`)),v.input);return(0,Z.jsxs)(Ee,{error:t,helperText:a,className:Y(M(b(`affixed-field`)),r),style:u,children:[e&&(0,Z.jsx)(Se,{required:n,error:m,children:e}),(0,Z.jsxs)(`div`,{className:x,children:[(()=>{if(h.length===0)return null;if(h.length===1)return(0,Z.jsxs)(Z.Fragment,{children:[(0,Z.jsx)(`span`,{className:Y(M(b(`affixed-field`,`prefix-span`)),v.prefixSpan),"aria-hidden":`true`,children:h[0].label}),(0,Z.jsx)(`span`,{id:y,className:v.visuallyHidden,children:h[0].label})]});let e=s??h[0].value;return(0,Z.jsx)(`select`,{className:Y(M(b(`affixed-field`,`prefix-select`)),v.prefixSelect),value:e,disabled:i,onChange:e=>c?.(e.target.value),"aria-label":`Prefix`,children:h.map(e=>(0,Z.jsx)(`option`,{value:e.value,children:e.label},e.value))})})(),(0,Z.jsx)(`input`,{className:S,type:l,disabled:i,"aria-invalid":m,"aria-required":n,...d,"aria-describedby":[d[`aria-describedby`],_?y:void 0].filter(Boolean).join(` `)||void 0})]})]})},Bn=s(`@thunderid/react`,`AuthOptionFactory`),Vn;function Hn(){return Vn??=q`
    overflow-wrap: anywhere;
    & * {
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    & .rich-text-align-left {
      text-align: left;
    }
    & .rich-text-align-center {
      text-align: center;
    }
    & .rich-text-align-right {
      text-align: right;
    }
    & .rich-text-align-justify {
      text-align: justify;
    }
    & a,
    & .rich-text-link {
      text-decoration: underline;
    }
    & span[role='img'] {
      display: inline-block;
    }
  `,Vn}var Un;function Wn(){return Un??=q({height:`1.25em`,objectFit:`contain`,width:`1.25em`}),Un}var Gn=12,Kn=e=>{switch(e){case m.EmailInput:return G.Email;case m.PhoneInput:return G.Tel;case m.PasswordInput:return G.Password;case m.TextInput:default:return G.Text}},qn=e=>({BODY_1:`body1`,BODY_2:`body2`,BUTTON_TEXT:`button`,CAPTION:`caption`,HEADING_1:`h1`,HEADING_2:`h2`,HEADING_3:`h3`,HEADING_4:`h4`,HEADING_5:`h5`,HEADING_6:`h6`,OVERLINE:`overline`,SUBTITLE_1:`subtitle1`,SUBTITLE_2:`subtitle2`})[e]||`h3`,Jn=(e,t,n,r,i,a)=>{let o=`${r}_auth`,s=e===o||t===o;return n.toLowerCase().includes(r)?!0:i===`signup`?s||n.toLowerCase().includes(r):s},Yn=(e,t,n,r,i,a,o,s,c,l={})=>{let u=l._theme,d=l._customRenderers??{},f=l.key||e.id,p=d[e.id]??d[e.type];if(p)return p(e,{additionalData:l.additionalData,authType:c,formErrors:r,formValues:t,isFormValid:a,isLoading:i,meta:l.meta,resetForm:o,onInputBlur:l.onInputBlur,onInputChange:s,onSubmit:l.onSubmit,touchedFields:n});let h=e=>!e||!l.t&&!l.meta?e||``:z(e,{meta:l.meta,t:l.t||(e=>e)});switch(e.type){case m.TextInput:case m.PasswordInput:case m.EmailInput:case m.PhoneInput:{let i=e.ref,a=t[i]||``,o=n[i]?r[i]:void 0,c=Kn(e.type),u=!!e.prefixes&&e.prefixes.length>0,d=typeof e.postfix==`string`&&e.postfix.length>0;if(u||d){let n=En(i,l.vendor),r=Dn(i,l.vendor),p=u?typeof e.prefixes==`string`?e.prefixes:e.prefixes[0].value:``,m=t[n]??p;return(0,Z.jsx)(zn,{className:Y(l.inputClassName,e.classes),id:e.id,label:h(e.label)||``,name:i,placeholder:h(e.placeholder)||``,required:e.required||!1,error:o,value:a,type:c,prefixes:e.prefixes,prefixValue:m,onChange:e=>s(i,e.target.value),onBlur:()=>l.onInputBlur?.(i),onPrefixChange:e=>s(n,e),onFocus:()=>{u&&t[n]===void 0&&s(n,p),d&&t[r]===void 0&&s(r,e.postfix)}},f)}return(0,X.cloneElement)(xn({className:Y(l.inputClassName,e.classes),error:o,id:e.id,label:h(e.label)||``,name:i,onBlur:()=>l.onInputBlur?.(i),onChange:e=>s(i,e),placeholder:h(e.placeholder)||``,required:e.required||!1,type:c,value:a}),{key:f})}case m.OtpInput:{let i=e.ref,a=t[i]||``,o=n[i]?r[i]:void 0,c=Number(l.additionalData?.otpLength),u=Number.isInteger(c)&&c>0?c:void 0,d=l.additionalData?.otpNumericOnly!==`false`;return(0,X.cloneElement)(xn({className:Y(l.inputClassName,e.classes),error:o,id:e.id,label:h(e.label)||``,length:u,name:i,numericOnly:d,onBlur:()=>l.onInputBlur?.(i),onChange:e=>s(i,e),placeholder:h(e.placeholder)||``,required:e.required||!1,type:G.Otp,value:a}),{key:f})}case m.Action:{let n=e.id,r=e.eventType||``,s=h(e.label),u=e.variant||``,d=r.toUpperCase()!==g.Submit,p={[g.Submit]:`submit`,[g.Reset]:`reset`,[g.Cancel]:`button`,[g.Trigger]:`button`,[g.Back]:`button`}[r.toUpperCase()]??`submit`,m=()=>{if(l.onSubmit){let n={};Object.keys(t).forEach(e=>{n[e]=t[e]});let i=l.additionalData?.consentPrompt;if(i&&r.toUpperCase()===g.Submit){let e=u.toLowerCase()!==`primary`,r={approved:!e,...e?{reason:I.REASON_USER_DENIED}:{},purposes:i.purposes.map(n=>({approved:!e,elements:[...(n.essential??[]).map(t=>({approved:!e,name:t.name})),...(n.optional??[]).map(r=>({approved:!e&&t[be(n.purposeId,r.name)]===`true`,name:r.name}))],purposeName:n.purposeName}))};n.consent_decisions=JSON.stringify(r)}r.toUpperCase()===g.Submit?l.onSubmit(e,n,d):(o(),l.onSubmit(e,{},d))}},_=Y(l.buttonClassName,e.classes);if(Jn(n,r,s,`google`,c,u))return(0,Z.jsx)(rn,{id:e.id,onClick:m,className:_},f);if(Jn(n,r,s,`github`,c,u))return(0,Z.jsx)(tn,{id:e.id,onClick:m,className:_},f);if(Jn(n,r,s,`facebook`,c,u))return(0,Z.jsx)(en,{id:e.id,onClick:m,className:_},f);if(Jn(n,r,s,`microsoft`,c,u))return(0,Z.jsx)(on,{id:e.id,onClick:m,className:_},f);if(Jn(n,r,s,`linkedin`,c,u))return(0,Z.jsx)(an,{id:e.id,onClick:m,className:_},f);if(Jn(n,r,s,`ethereum`,c,u))return(0,Z.jsx)(sn,{id:e.id,onClick:m,className:_},f);if(n===`prompt_mobile`||r===`prompt_mobile`)return(0,Z.jsx)(An,{id:e.id,onClick:m,className:_},f);let v=e.startIcon?(0,Z.jsx)(`img`,{src:e.startIcon,alt:``,"aria-hidden":`true`,className:Wn()}):null,y=e.endIcon?(0,Z.jsx)(`img`,{src:e.endIcon,alt:``,"aria-hidden":`true`,className:Wn()}):null;return(0,Z.jsx)(jt,{fullWidth:!0,id:e.id,onClick:m,disabled:i||!a&&!d||l.isTimeoutDisabled||e.config?.disabled,className:Y(l.buttonClassName,e.classes),"data-testid":`thunderid-signin-submit`,variant:e.variant?.toLowerCase()===`primary`?`solid`:`outline`,color:e.variant?.toLowerCase()===`primary`?`primary`:`secondary`,startIcon:v,endIcon:y,type:p,children:s||`Submit`},f)}case m.Text:{let t=qn(e.variant),n=q({marginBottom:2,textAlign:typeof e?.align==`string`?e.align:`left`});return(0,Z.jsx)(je,{id:e.id,className:Y(e.classes,n),variant:t,children:h(e.label)},f)}case m.Divider:return(0,Z.jsx)(Cn,{children:h(e.label)||``},f);case m.Select:{let i=e.ref,a=t[i]||``,o=n[i]?r[i]:void 0,c=(e.options||[]).map(e=>({label:typeof e==`string`?e:String(e.label??e.value??``),value:typeof e==`string`?e:String(e.value??``)}));return(0,Z.jsx)(yn,{id:e.id,name:i,label:h(e.label)||``,placeholder:h(e.placeholder),required:e.required,options:c,value:a,error:o,onChange:e=>s(i,e.target.value),onBlur:()=>l.onInputBlur?.(i),className:Y(l.inputClassName,e.classes)},f)}case m.DateInput:{let i=e.ref,a=t[i]||``,o=n[i]?r[i]:void 0;return(0,Z.jsx)(dn,{id:e.id,name:i,label:h(e.label)||``,placeholder:h(e.placeholder),required:e.required,dateFormat:e.dateFormat,value:a,error:o,onChange:e=>s(i,e.target.value),onBlur:()=>l.onInputBlur?.(i),className:Y(l.inputClassName,e.classes)},f)}case m.OuSelect:return Bn.warn(`OU_SELECT component type is not supported. Skipping render.`),null;case m.Block:if(e.components&&e.components.length>0){let d=q({display:`flex`,flexDirection:`column`,gap:`calc(${u?.vars?.spacing?.unit??`4px`} * 2)`}),p=e.components.map((u,d)=>Yn(u,t,n,r,i,a,o,s,c,{...l,key:u.id||`${e.id}_${d}`})).filter(Boolean);return(0,Z.jsx)(`form`,{id:e.id,className:Y(e.classes,d),children:p},f)}return null;case m.RichText:{let n=e.action,r=()=>{if(!n||!l.onSubmit)return;let r=String(n.eventType??g.Submit),i=r.toUpperCase()===String(g.Trigger),a={eventType:r,id:`${e.id}_action`,ref:n.ref,type:m.Action},o={};Object.keys(t).forEach(e=>{o[e]=t[e]}),l.onSubmit(a,o,i)},i=e=>e.getAttribute(`data-action-ref`)===n?.ref,a=n?e=>{let t=e.target.closest(`a`);!t||!i(t)||(e.preventDefault(),r())}:void 0,o=n?e=>{if(e.key!==`Enter`&&e.key!==` `)return;let t=e.target.closest(`a`);!t||!i(t)||(e.preventDefault(),r())}:void 0;return(0,Z.jsx)(`div`,{className:Hn(),onClick:a,onKeyDown:o,dangerouslySetInnerHTML:{__html:we.sanitize(L(h(e.label)))}},f)}case m.Image:{let t=h(e.height?.toString()),n=h(e.width?.toString());return(0,Z.jsx)(kn,{component:{config:{alt:h(e.alt)||h(e.label)||`Image`,height:t||(l.inStack?`50`:`auto`),src:h(e.src),width:n||(l.inStack?`50`:`100%`)}},formErrors:void 0,formValues:void 0,isFormValid:!1,isLoading:!1,onInputChange:()=>{throw Error(`Function not implemented.`)},touchedFields:void 0},f)}case m.Icon:{let t=e.name||``,n=In[t];return n?(0,Z.jsx)(n,{size:e.size||24,color:e.color||`currentColor`},f):(Bn.warn(`Unknown icon name: "${t}". Skipping render.`),null)}case m.Stack:{let u=e.direction||`row`,d=e.gap??2,p=e.align||`center`,m=e.justify||`flex-start`,h=e.items,g=typeof h==`string`?Number(h):typeof h==`number`?h:NaN,_=Number.isFinite(g)&&Math.floor(g)>=2?Math.min(Math.floor(g),Gn):null,v=u.startsWith(`column`),y=e.justify??`stretch`,b=y===`stretch`?`1fr`:`auto`,x=q(_===null?{alignItems:p,display:`flex`,flexDirection:u,flexWrap:`wrap`,gap:`${d*.5}rem`,justifyContent:m}:{alignItems:e.align??`stretch`,display:`grid`,gap:`${d*.5}rem`,gridAutoFlow:v?`column`:`row`,justifyContent:y,width:`100%`,...v?{gridTemplateRows:`repeat(${_}, ${b})`}:{gridTemplateColumns:`repeat(${_}, ${b})`}}),S=e.components?e.components.map((u,d)=>Yn(u,t,n,r,i,a,o,s,c,{...l,inStack:!0,key:u.id||`${e.id}_${d}`})):[];return(0,Z.jsx)(`div`,{id:e.id,className:Y(e.classes,x),children:S},f)}case m.Consent:{let n=l.additionalData?.consentPrompt;return(0,Z.jsx)(ve,{consentData:n,formValues:t,onInputChange:s,config:e.config,meta:l.meta,t:l.t},f)}case m.Timer:{let t=h(e.label)||`Time remaining: {time}`,n=Number(l.additionalData?.stepTimeout)||0;return(0,Z.jsx)(Te,{expiresIn:n>0?Math.max(0,Math.floor((n-Date.now())/1e3)):0,textTemplate:t},f)}case m.CopyableText:{let t=e.source,n=t&&l.additionalData?String(l.additionalData[t]??``):``;return(0,Z.jsx)(Mn,{label:h(e.label)||void 0,value:n},f)}default:return Bn.warn(`Unsupported component type: ${e.type}. Skipping render.`),null}},Xn=(e,t,n,r,i,a,o,s,c)=>e.map((e,l)=>Yn(e,t,n,r,i,a,o,s,`signup`,{...c,key:e.id||l})).filter(e=>e!==null),Zn=(e,t)=>(0,X.useMemo)(()=>{let t=q`
      background: ${e.vars.colors.background.surface};
      border-radius: ${e.vars.borderRadius.large};
      gap: calc(${e.vars.spacing.unit} * 2);
      min-width: 420px;
      font-family: ${e.vars.typography.fontFamily};
    `,n=q`
      gap: 0;
      align-items: center;
    `,r=q`
      margin: 0 0 calc(${e.vars.spacing.unit} * 1) 0;
      color: ${e.vars.colors.text.primary};
    `,i=q`
      margin-bottom: calc(${e.vars.spacing.unit} * 1);
      color: ${e.vars.colors.text.secondary};
    `;return{card:t,centeredSpinnerContainer:q`
      display: flex;
      justify-content: center;
      padding: 2rem;
    `,centeredSpinnerContainerSmall:q`
      display: flex;
      justify-content: center;
      padding: 1rem;
    `,errorContainer:q`
      margin-bottom: 1rem;
    `,header:n,subtitle:i,title:r}},[e.vars.colors.background.surface,e.vars.colors.text.primary,e.vars.colors.text.secondary,e.vars.borderRadius.large,e.vars.spacing.unit,e.vars.typography.fontFamily,t]),Qn=({onInitialize:e,onSubmit:t,onError:n,onFlowChange:r,className:i=``,children:a,fetchOrganizationUnitChildren:o,isInitialized:s=!0,preferences:c,size:u=`medium`,variant:d=`outlined`,showTitle:f=!0,showSubtitle:p=!0})=>{let{meta:m,isInitialized:h,getStorageManager:g}=D(),{t:_}=ht(c?.i18n),{theme:v}=J(),y=(0,X.useContext)(pt),b=Zn(v,v.vars.colors.text.primary),[x,C]=(0,X.useState)(!1),[w,T]=(0,X.useState)(!1),[E,O]=(0,X.useState)(null),[k,A]=(0,X.useState)(null),[j,M]=(0,X.useState)({}),[N,P]=(0,X.useState)({}),[F,I]=(0,X.useState)({}),[L,R]=(0,X.useState)(!0),z=(0,X.useRef)(null);(0,X.useEffect)(()=>{let e=E?.data?.fieldErrors;if(!e||e.length===0)return;let t={},n={};for(let r of e)r.identifier in t||(t[r.identifier]=r.message,n[r.identifier]=!0);P(t),I(e=>({...e,...n}))},[E]);let ee=(0,X.useRef)(!1);(0,X.useEffect)(()=>{h&&(async()=>{try{let e=await(await g())?.getTemporaryData();e?.challengeToken&&(z.current=e.challengeToken)}catch{}})()},[h]);let te=async e=>{z.current=e;try{let t=await g();t&&(e?await t.setTemporaryDataParameter(`challengeToken`,e):await t.removeTemporaryDataParameter(`challengeToken`))}catch{oe.warn(`Failed to persist challenge token in storage.`)}},B=(0,X.useCallback)(e=>{let t=Ct(e,_,`components.inviteUser.errors.generic`);A(e instanceof Error?e:Error(t)),n?.(e instanceof Error?e:Error(t))},[_,n]),ne=(0,X.useCallback)(e=>{if(!e?.data?.meta?.components)return e;try{let{components:t}=Tt(e,_,{defaultErrorKey:`components.inviteUser.errors.generic`,resolveTranslations:!1},m);return{...e,data:{...e.data,components:t}}}catch{return e}},[_,a]),re=(0,X.useCallback)((e,t)=>{M(n=>({...n,[e]:t})),P(t=>{let n={...t};return delete n[e],n})},[]),V=(0,X.useCallback)(e=>{I(t=>({...t,[e]:!0}))},[]),ie=(0,X.useCallback)(e=>{let t={},n=e=>{e.forEach(e=>{if((e.type===`TEXT_INPUT`||e.type===`EMAIL_INPUT`||e.type===`SELECT`||e.type===`PHONE_INPUT`||e.type===`OTP_INPUT`||e.type===`DATE_INPUT`)&&e.ref){let n=j[e.ref];if(e.required&&(!n||n.trim()===``))t[e.ref]=`${e.label||e.ref} is required`;else if(e.type===`EMAIL_INPUT`&&n&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n)&&(t[e.ref]=`Please enter a valid email address`),n&&!t[e.ref]){let r=S(e.validation);if(r){let i=r(n);i&&(t[e.ref]=_(i))}}}e.components&&Array.isArray(e.components)&&n(e.components)})};return n(e),{errors:t,isValid:Object.keys(t).length===0}},[j]),H=(0,X.useCallback)(async(e,n)=>{if(!E)return;let i=ie(E.data?.components||[]);if(!i.isValid){P(i.errors),R(!1);let e={};Object.keys(i.errors).forEach(t=>{e[t]=!0}),I(t=>({...t,...e}));return}C(!0),A(null),R(!0);try{let i=n||j,a={executionId:E.executionId,inputs:i,verbose:!0,...z.current?{challengeToken:z.current}:{}};e?.id&&(a.action=e.id);let o=ne(await t(a));if(r?.(o),await te(o.challengeToken??null),o.flowStatus===`ERROR`){B(o);return}O(o),M({}),P({}),I({}),o?.error&&B(o)}catch(e){B(e)}finally{C(!1)}},[E,j,ie,t,r,B,ne]),ae=(0,X.useCallback)(()=>{T(!1),O(null),A(null),M({}),P({}),I({}),ee.current=!1},[]),se=(0,X.useCallback)(()=>{M({}),P({}),I({}),A(null),R(!0)},[]);(0,X.useEffect)(()=>{s&&!w&&!ee.current&&(ee.current=!0,(async()=>{C(!0),A(null);try{let t=ne(await e({flowType:l.UserOnboarding,verbose:!0}));await te(t.challengeToken??null),O(t),T(!0),r?.(t),t.flowStatus===`ERROR`&&B(t)}catch(e){B(e)}finally{C(!1)}})())},[s,w,e,r,B,ne]),(0,X.useEffect)(()=>{if(E&&w){let e=E.data?.components||[];e.length>0&&R(ie(e).isValid)}},[j,E,w,ie]);let ce=(0,X.useCallback)(e=>{let t,n;return e.forEach(e=>{e.type===`TEXT`&&(e.variant===`HEADING_1`&&!t?t=e.label:(e.variant===`HEADING_2`||e.variant===`SUBTITLE_1`)&&!n&&(n=e.label))}),{subtitle:n,title:t}},[]),le=(0,X.useCallback)(e=>e.filter(e=>!(e.type===`TEXT`&&(e.variant===`HEADING_1`||e.variant===`HEADING_2`))),[]),ue=(0,X.useCallback)(e=>Xn(e,j,F,N,x,L,se,re,{_customRenderers:y,_theme:v,additionalData:E?.data?.additionalData,fetchOrganizationUnitChildren:o,onInputBlur:V,onSubmit:H,size:u,variant:d}),[y,E?.data?.additionalData,o,j,F,N,x,L,re,V,H,u,v,d]),de=E?.data?.components||E?.data?.meta?.components||[],{title:U,subtitle:W}=ce(de),G=le(de),fe={additionalData:E?.data?.additionalData,components:de,error:k,executionId:E?.executionId,fieldErrors:N,handleInputBlur:V,handleInputChange:re,handleSubmit:H,isLoading:x,isValid:L,meta:m,resetFlow:ae,subtitle:W,title:U,touched:F,values:j};return a?(0,Z.jsx)(`div`,{className:i,children:a(fe)}):!s||!w&&x?(0,Z.jsx)(Zt,{className:Y(i,b.card),variant:d,children:(0,Z.jsx)(Zt.Content,{children:(0,Z.jsx)(`div`,{className:b.centeredSpinnerContainer,children:(0,Z.jsx)(Dt,{size:`medium`})})})}):!E&&k?(0,Z.jsx)(Zt,{className:Y(i,b.card),variant:d,children:(0,Z.jsx)(Zt.Content,{children:(0,Z.jsxs)(Ht,{variant:`error`,children:[(0,Z.jsx)(Ht.Title,{children:`Error`}),(0,Z.jsx)(Ht.Description,{children:k.message})]})})}):(0,Z.jsxs)(Zt,{className:Y(i,b.card),variant:d,children:[(f||p)&&(U||W)&&(0,Z.jsxs)(Zt.Header,{className:b.header,children:[f&&U&&(0,Z.jsx)(Zt.Title,{level:2,className:b.title,children:U}),p&&W&&(0,Z.jsx)(je,{variant:`body1`,className:b.subtitle,children:W})]}),(0,Z.jsxs)(Zt.Content,{children:[k&&(0,Z.jsx)(`div`,{className:b.errorContainer,children:(0,Z.jsx)(Ht,{variant:`error`,children:(0,Z.jsx)(Ht.Description,{children:k.message})})}),(0,Z.jsxs)(`div`,{children:[G&&G.length>0?ue(G):!x&&(0,Z.jsx)(Ht,{variant:`warning`,children:(0,Z.jsx)(je,{variant:`body1`,children:`No form components available`})}),x&&(0,Z.jsx)(`div`,{className:b.centeredSpinnerContainerSmall,children:(0,Z.jsx)(Dt,{size:`small`})})]})]})]})},$n=({onError:e,onFlowChange:t,className:n,children:r,size:i=`medium`,variant:a=`outlined`,showTitle:o=!0,showSubtitle:s=!0})=>{let{http:c,baseUrl:u,endpoints:d,getAccessToken:f,isInitialized:p}=D(),m=de(`flowExecute`,{endpoints:d})??`${u}/flow/execute`;return(0,Z.jsx)(Qn,{onInitialize:async e=>(await c.request({data:{...e,flowType:l.UserOnboarding,verbose:!0},headers:{Accept:`application/json`,"Content-Type":`application/json`},method:`POST`,url:m})).data,onSubmit:async e=>(await c.request({data:{...e,verbose:!0},headers:{Accept:`application/json`,"Content-Type":`application/json`},method:`POST`,url:m})).data,onError:e,onFlowChange:t,className:n,fetchOrganizationUnitChildren:(0,X.useCallback)(async(e,t,n)=>le({baseUrl:u,headers:{Authorization:`Bearer ${await f()}`},limit:t,offset:n,organizationUnitId:e}),[u,f]),isInitialized:p,size:i,variant:a,showTitle:o,showSubtitle:s,children:r})},er={USERS:`users`,USER:`user`,USER_USAGES:`user-usages`,USER_TYPES:`userTypes`,USER_TYPE:`userType`},Q=_(),tr={COMPLETE:`COMPLETE`,ERROR:`ERROR`,INCOMPLETE:`INCOMPLETE`};async function nr(e,t){return((await e.request({url:`${t}/server-config/flow`,method:`GET`}))?.data??{}).merged?.userDeletionFlow?.defaultHandle??``}async function rr(e,t,n){for(let r=0;;r+=100){let i=((await e.request({url:`${t}/flows?flowType=ADMINISTRATION&limit=100&offset=${r}`,method:`GET`}))?.data??{}).flows??[],a=i.find(e=>e.handle===n&&e.flowType===`ADMINISTRATION`);if(a)return a.id;if(i.length<100)return null}}async function ir(e,t,n,r){let i=(await e.request({url:`${t}/flow/execute`,method:`POST`,headers:{"Content-Type":`application/json`},data:{flowId:n,inputs:{subject:r}}}))?.data??{};if(i.flowStatus!==tr.COMPLETE)throw i.flowStatus===tr.INCOMPLETE?Error(`The user deletion flow requires additional input and could not be completed`):Error(i.failureReason??`The user deletion flow did not complete`)}async function ar(e,t,n){await e.request({url:`${t}/users/${n}`,method:`DELETE`,headers:{"Content-Type":`application/json`}})}async function or(e,t,n){let r=await nr(e,t);if(r){let i=await rr(e,t,r);if(i){await ir(e,t,i,n);return}}await ar(e,t,n)}function sr(){let e=(0,Q.c)(10),{http:t}=D(),{getServerUrl:n}=P(),r=N(),{t:i}=K(`users`),{showToast:a}=ae(),o;e[0]!==n||e[1]!==t?(o=async e=>{await or(t,n(),e)},e[0]=n,e[1]=t,e[2]=o):o=e[2];let s;e[3]!==r||e[4]!==a||e[5]!==i?(s=(e,t)=>{r.removeQueries({queryKey:[er.USER,t]}),r.invalidateQueries({queryKey:[er.USERS]}).catch(cr),a(i(`delete.success`),`success`)},e[3]=r,e[4]=a,e[5]=i,e[6]=s):s=e[6];let c;return e[7]!==o||e[8]!==s?(c={mutationFn:o,onSuccess:s},e[7]=o,e[8]=s,e[9]=c):c=e[9],Xe(c)}function cr(){}function lr(e){let t=(0,Q.c)(10),{http:n}=D(),{getServerUrl:r}=P(),i;t[0]===e?i=t[1]:(i=[er.USER,e],t[0]=e,t[1]=i);let a;t[2]!==r||t[3]!==n||t[4]!==e?(a=async()=>{let t=r();return(await n.request({url:`${t}/users/${e}?include=display`,method:`GET`,headers:{"Content-Type":`application/json`}})).data},t[2]=r,t[3]=n,t[4]=e,t[5]=a):a=t[5];let o=!!e,s;return t[6]!==i||t[7]!==a||t[8]!==o?(s={queryKey:i,queryFn:a,enabled:o},t[6]=i,t[7]=a,t[8]=o,t[9]=s):s=t[9],V(s)}function ur(e,t){let n=(0,Q.c)(10),r=t===void 0?!0:t,{http:i}=D(),{getServerUrl:a}=P(),o;n[0]===e?o=n[1]:(o=[er.USER_USAGES,e],n[0]=e,n[1]=o);let s;n[2]!==a||n[3]!==i||n[4]!==e?(s=async()=>{let t=a();return(await i.request({url:`${t}/users/${encodeURIComponent(e)}/usages`,method:`GET`,headers:{"Content-Type":`application/json`}})).data},n[2]=a,n[3]=i,n[4]=e,n[5]=s):s=n[5];let c=!!e&&r,l;return n[6]!==o||n[7]!==s||n[8]!==c?(l={queryKey:o,queryFn:s,enabled:c},n[6]=o,n[7]=s,n[8]=c,n[9]=l):l=n[9],V(l)}function dr(e){let t=(0,Q.c)(15),{http:n}=D(),{getServerUrl:r}=P(),i;t[0]===e?i=t[1]:(i=e??{},t[0]=e,t[1]=i);let{limit:a,offset:o,filter:s}=i,c;t[2]!==s||t[3]!==a||t[4]!==o?(c=[er.USERS,{limit:a,offset:o,filter:s}],t[2]=s,t[3]=a,t[4]=o,t[5]=c):c=t[5];let l;t[6]!==s||t[7]!==r||t[8]!==n||t[9]!==a||t[10]!==o?(l=async()=>{let e=r(),t=new URLSearchParams;a!==void 0&&t.append(`limit`,String(a)),o!==void 0&&t.append(`offset`,String(o)),s&&t.append(`filter`,s),t.append(`include`,`display`);let i=t.toString();return(await n.request({url:`${e}/users${i?`?${i}`:``}`,method:`GET`,headers:{"Content-Type":`application/json`}})).data},t[6]=s,t[7]=r,t[8]=n,t[9]=a,t[10]=o,t[11]=l):l=t[11];let u;return t[12]!==c||t[13]!==l?(u={queryKey:c,queryFn:l},t[12]=c,t[13]=l,t[14]=u):u=t[14],V(u)}function fr(e){let t=(0,Q.c)(10),{http:n}=D(),{getServerUrl:r}=P(),i;t[0]===e?i=t[1]:(i=[er.USER_TYPE,e],t[0]=e,t[1]=i);let a;t[2]!==r||t[3]!==n||t[4]!==e?(a=async()=>{let t=r();return(await n.request({url:`${t}/user-types/${e}`,method:`GET`,headers:{"Content-Type":`application/json`}})).data},t[2]=r,t[3]=n,t[4]=e,t[5]=a):a=t[5];let o=!!e,s;return t[6]!==i||t[7]!==a||t[8]!==o?(s={queryKey:i,queryFn:a,enabled:o},t[6]=i,t[7]=a,t[8]=o,t[9]=s):s=t[9],V(s)}function pr(e){let t=(0,Q.c)(13),{http:n}=D(),{getServerUrl:r}=P(),i;t[0]===e?i=t[1]:(i=e??{},t[0]=e,t[1]=i);let{limit:a,offset:o}=i,s;t[2]!==a||t[3]!==o?(s=[er.USER_TYPES,{limit:a,offset:o}],t[2]=a,t[3]=o,t[4]=s):s=t[4];let c;t[5]!==r||t[6]!==n||t[7]!==a||t[8]!==o?(c=async()=>{let e=r(),t=new URLSearchParams;a!==void 0&&t.append(`limit`,String(a)),o!==void 0&&t.append(`offset`,String(o));let i=t.toString();return(await n.request({url:`${e}/user-types${i?`?${i}`:``}`,method:`GET`,headers:{"Content-Type":`application/json`}})).data},t[5]=r,t[6]=n,t[7]=a,t[8]=o,t[9]=c):c=t[9];let l;return t[10]!==s||t[11]!==c?(l={queryKey:s,queryFn:c},t[10]=s,t[11]=c,t[12]=l):l=t[12],V(l)}function mr(){let e=(0,Q.c)(10),{http:t}=D(),{getServerUrl:n}=P(),r=N(),{t:i}=K(`users`),{showToast:a}=ae(),o;e[0]!==n||e[1]!==t?(o=async e=>{let{userId:r,data:i}=e,a=n();return(await t.request({url:`${a}/users/${r}`,method:`PUT`,headers:{"Content-Type":`application/json`},data:i})).data},e[0]=n,e[1]=t,e[2]=o):o=e[2];let s;e[3]!==r||e[4]!==a||e[5]!==i?(s=(e,t)=>{r.invalidateQueries({queryKey:[er.USER,t.userId]}).catch(gr),r.invalidateQueries({queryKey:[er.USERS]}).catch(hr),a(i(`update.success`),`success`)},e[3]=r,e[4]=a,e[5]=i,e[6]=s):s=e[6];let c;return e[7]!==o||e[8]!==s?(c={mutationFn:o,onSuccess:s},e[7]=o,e[8]=s,e[9]=c):c=e[9],Xe(c)}function hr(){}function gr(){}function _r(e){let t=(0,Q.c)(8),{value:n,onChange:r,fieldLabel:i}=e,[a,o]=(0,X.useState)(``),s;if(t[0]!==i||t[1]!==a||t[2]!==r||t[3]!==n){let e=Array.isArray(n)?n:[],c=()=>{a.trim()&&(r([...e,a.trim()]),o(``))},l=t=>{r(e.filter((e,n)=>n!==t))},u;t[5]===c?u=t[6]:(u=e=>{e.key===`Enter`&&(e.preventDefault(),c())},t[5]=c,t[6]=u);let d=u,f;t[7]===Symbol.for(`react.memo_cache_sentinel`)?(f=e=>o(e.target.value),t[7]=f):f=t[7],s=(0,Z.jsxs)(w,{children:[(0,Z.jsxs)(w,{sx:{display:`flex`,gap:1,mb:1},children:[(0,Z.jsx)(j,{value:a,onChange:f,onKeyDown:d,placeholder:`Add ${i.toLowerCase()}`,fullWidth:!0,size:`small`,variant:`outlined`}),(0,Z.jsx)(W,{size:`small`,onClick:c,disabled:!a.trim(),children:(0,Z.jsx)(Re,{size:16})})]}),(0,Z.jsx)(w,{sx:{display:`flex`,flexWrap:`wrap`,gap:1},children:e.length>0&&e.map((e,t)=>(0,Z.jsx)(ee,{label:String(e),onDelete:()=>l(t),variant:`outlined`,size:`medium`},`chip-${e}`))})]}),t[0]=i,t[1]=a,t[2]=r,t[3]=n,t[4]=s}else s=t[4];return s}var vr=_r;function yr({id:e,value:t,placeholder:n,required:r,error:i,helperText:a=void 0,color:o,onChange:s,onBlur:l=void 0,inputRef:u,name:d,ariaLabel:f=void 0}){let[p,m]=(0,X.useState)(!1);return(0,Z.jsx)(j,{id:e,name:d,value:t,type:p?`text`:`password`,placeholder:n,fullWidth:!0,required:r,variant:`outlined`,error:i,helperText:a,color:o,onChange:s,onBlur:l,inputRef:u,slotProps:{htmlInput:{"aria-label":f},input:{endAdornment:(0,Z.jsx)(c,{position:`end`,children:(0,Z.jsx)(W,{"aria-label":p?`hide password`:`show password`,onClick:()=>m(e=>!e),edge:`end`,children:p?(0,Z.jsx)(Be,{}):(0,Z.jsx)(Ie,{})})})}}})}var br=yr,xr=`USR-1027`,Sr=`This user cannot be deleted because {{dependencies}} depend on it. Remove or reassign them first.`;function Cr(e){let t=e;return t.response?.data?.code??t.code??t.error?.code}function wr(e){let t=e;return t.error?.message?.params??t.error?.description?.params}function Tr(e,t,n,r){let i=Cr(e);if(i===xr){let i=e.response?.data?.description?.params?.dependencies;return i?t(`errors.${xr}`,{dependencies:i,defaultValue:Sr}):r===void 0?t(n):t(n,{defaultValue:r})}if(i&&!e.response?.data?.code){let a={...wr(e),defaultValue:``};return t(`errors.${i}`,a)||t(`common:errors.${i}`,a)||(r===void 0?t(n):t(n,{defaultValue:r}))}return he(e,t,n,r)}var Er=5;function Dr({open:e,userId:t,onClose:n,onSuccess:r=void 0}){let{t:i}=K(`users`),a=sr(),[o,s]=(0,X.useState)(null),{data:c,isLoading:l}=ur(t,e),d=c!==void 0&&c.totalResults!==null,f=c?.usages.filter(e=>e.behaviorOnDelete===`restrict`)??[],p=d&&f.length>0,m=f.slice(0,Er),h=f.length-m.length,g=()=>{a.isPending||(s(null),a.reset(),n())};return(0,Z.jsxs)(We,{open:e,onClose:g,maxWidth:`sm`,fullWidth:!0,children:[(0,Z.jsx)(Je,{children:i(`delete.title`,`Delete User`)}),(0,Z.jsxs)(Ke,{children:[(0,Z.jsx)(qe,{sx:{mb:2},children:i(`delete.message`,`Are you sure you want to delete this user? This action cannot be undone.`)}),l?(0,Z.jsx)(E,{severity:`info`,icon:(0,Z.jsx)(v,{size:16}),sx:{mb:2},children:i(`delete.usages.loading`,`Checking affected resources…`)}):d?p?(0,Z.jsxs)(E,{severity:`error`,sx:{mb:2},children:[(0,Z.jsx)(U,{variant:`body2`,sx:{mb:1},children:i(`delete.blocking.title`,`This user cannot be deleted until the following agents are reassigned or removed:`)}),(0,Z.jsxs)(x,{dense:!0,disablePadding:!0,children:[m.map(e=>(0,Z.jsx)(fe,{disableGutters:!0,sx:{py:0},children:(0,Z.jsx)(u,{primary:(0,Z.jsx)(U,{variant:`body2`,children:e.displayName})})},e.id)),h>0&&(0,Z.jsx)(fe,{disableGutters:!0,sx:{py:0},children:(0,Z.jsx)(u,{primary:(0,Z.jsx)(U,{variant:`body2`,color:`text.secondary`,children:i(`delete.usages.more`,{count:h,defaultValue:`+{{count}} more`})})})})]})]}):(0,Z.jsx)(E,{severity:`info`,sx:{mb:2},children:i(`delete.usages.none`,`No agents currently list this user as their owner.`)}):(0,Z.jsx)(E,{severity:`warning`,sx:{mb:2},children:i(`delete.disclaimer`,`All associated data will be permanently removed.`)}),o&&(0,Z.jsx)(E,{severity:`error`,sx:{mt:2},children:o})]}),(0,Z.jsxs)(Ge,{children:[(0,Z.jsx)(H,{onClick:g,disabled:a.isPending,children:i(`common:actions.cancel`)}),(0,Z.jsx)(H,{onClick:()=>{t&&(s(null),a.mutate(t,{onSuccess:()=>{s(null),n(),r?.()},onError:e=>{s(Tr(e,i,`delete.error`,`Failed to delete user. Please try again.`))}}))},color:`error`,variant:`contained`,disabled:a.isPending||!t||l||p,children:a.isPending?i(`common:status.deleting`,`Deleting...`):i(`common:actions.delete`,`Delete`)})]})]})}var Or={DEFAULT_AVATAR_PREFIX:`avatar:shape=circle,variant=two_letter,colors=0,content=`},kr={users:{list:()=>`/users`,detail:e=>`/users/${e}`,add:()=>`/users/add`,addCreate:()=>`/users/add/create`}};function Ar(){return ne().users??kr.users}function jr(){let e=it(),{t}=K(),n=ge(`UsersList`),i=$e(),a=Ar(),{data:s,isLoading:c,error:l,refetch:u}=dr(),[d,f]=(0,X.useState)(null),[p,m]=(0,X.useState)(!1),h=(0,X.useCallback)(e=>{f(e),m(!0)},[]),g=(0,X.useCallback)(t=>{(async()=>{await e(a.detail(t))})().catch(e=>{n.error(`Failed to navigate to user details`,{error:e,userId:t})})},[n,e,a]),_=()=>{m(!1),f(null)},v=(0,X.useMemo)(()=>[{field:`name`,headerName:t(`users:listing.columns.name`,`Name`),flex:1,minWidth:200,renderCell:e=>{let t=e.row.display??e.row.id,n=e.row.attributes?.picture,i=typeof n==`string`?n:void 0;return(0,Z.jsx)(r.CellIcon,{sx:{width:`100%`},icon:(0,Z.jsx)(Ye,{value:i,size:30,fallback:`${Or.DEFAULT_AVATAR_PREFIX}${ke(t)}`}),primary:t})}},{field:`id`,headerName:t(`users:listing.columns.userId`,`User ID`),flex:1,minWidth:200,renderCell:e=>(0,Z.jsx)(U,{variant:`body2`,sx:{fontFamily:`monospace`,fontSize:`0.875rem`},children:e.row.id})},{field:`ouHandle`,headerName:t(`users:listing.columns.organizationUnit`,`Organization Unit`),flex:.5,minWidth:150,renderCell:e=>(0,Z.jsx)(U,{variant:`body2`,sx:{fontFamily:`monospace`,fontSize:`0.875rem`},children:e.row.ouHandle??e.row.ouId??`-`})},{field:`actions`,headerName:t(`users:listing.columns.actions`,`Actions`),width:150,align:`center`,headerAlign:`center`,sortable:!1,filterable:!1,hideable:!1,renderCell:e=>(0,Z.jsx)(r.RowActions,{children:e.row.isReadOnly?(0,Z.jsx)(o,{title:t(`common:status.readOnly`,`Read Only`),children:(0,Z.jsx)(W,{size:`small`,disableRipple:!0,sx:{cursor:`default`},children:(0,Z.jsx)(Ie,{size:16})})}):(0,Z.jsxs)(Z.Fragment,{children:[(0,Z.jsx)(o,{title:t(`common:actions.edit`),children:(0,Z.jsx)(W,{size:`small`,onClick:t=>{t.stopPropagation(),g(e.row.id)},children:(0,Z.jsx)(Pe,{size:16})})}),(0,Z.jsx)(o,{title:t(`common:actions.delete`),children:(0,Z.jsx)(W,{size:`small`,color:`error`,onClick:t=>{t.stopPropagation(),h(e.row.id)},children:(0,Z.jsx)(Me,{size:16})})})]})})}],[h,g,t]);return l?(0,Z.jsx)(tt,{error:l,t,variant:`block`,title:t(`users:listing.error`,`Failed to load users`),onRetry:()=>void u()}):(0,Z.jsxs)(Z.Fragment,{children:[(0,Z.jsx)(r.Provider,{variant:`data-grid-card`,loading:c,children:(0,Z.jsx)(r.Container,{disablePaper:!0,children:(0,Z.jsx)(r.DataGrid,{rows:s?.users??[],columns:v,getRowId:e=>e.id,onRowClick:e=>{g(e.row.id)},initialState:{pagination:{paginationModel:{pageSize:10}}},pageSizeOptions:[5,10,25,50],disableRowSelectionOnClick:!0,disableColumnFilter:!0,localeText:i,autoHeight:!0,sx:{"& .MuiDataGrid-row":{cursor:`pointer`}}})})}),(0,Z.jsx)(Dr,{open:p,userId:d,onClose:_})]})}function Mr(e){let t=(0,Q.c)(8),{user:n,copiedField:r,onCopyToClipboard:i}=e,{t:a}=K(),s;if(t[0]!==r||t[1]!==i||t[2]!==a||t[3]!==n.id){let e;t[5]!==i||t[6]!==n.id?(e=()=>{i(n.id,`userId`).catch(Nr)},t[5]=i,t[6]=n.id,t[7]=e):e=t[7],s=(0,Z.jsx)(nt,{title:a(`users:manageUser.sections.quickCopy.title`,`Quick Copy`),description:a(`users:manageUser.sections.quickCopy.description`,`Copy user identifiers for use in your application.`),children:(0,Z.jsx)(y,{spacing:3,children:(0,Z.jsxs)(C,{fullWidth:!0,children:[(0,Z.jsx)(f,{htmlFor:`user-id-input`,children:a(`users:manageUser.sections.quickCopy.userId`,`User ID`)}),(0,Z.jsx)(j,{fullWidth:!0,id:`user-id-input`,value:n.id,InputProps:{readOnly:!0,endAdornment:(0,Z.jsx)(c,{position:`end`,children:(0,Z.jsx)(o,{title:r===`userId`?a(`common:actions.copied`,`Copied`):a(`users:manageUser.sections.quickCopy.copyUserId`,`Copy User ID`),children:(0,Z.jsx)(W,{"aria-label":r===`userId`?a(`common:actions.copied`,`Copied`):a(`users:manageUser.sections.quickCopy.copyUserId`,`Copy User ID`),onClick:e,edge:`end`,children:r===`userId`?(0,Z.jsx)(Fe,{size:16}):(0,Z.jsx)(ze,{size:16})})})})},sx:{"& input":{fontFamily:`monospace`,fontSize:`0.875rem`}}})]})})}),t[0]=r,t[1]=i,t[2]=a,t[3]=n.id,t[4]=s}else s=t[4];return s}function Nr(){return null}async function Pr(e,t,n,r){let i=new URLSearchParams({limit:String(r.limit),offset:String(r.offset)});return(await e.request({url:`${t}/organization-units/${encodeURIComponent(n)}/ous?${i.toString()}`,method:`GET`,headers:{"Content-Type":`application/json`}})).data}async function Fr(e,t,n){let r=new URLSearchParams({limit:String(n.limit),offset:String(n.offset)});return(await e.request({url:`${t}/organization-units?${r.toString()}`,method:`GET`,headers:{"Content-Type":`application/json`}})).data}var Ir={ORGANIZATION_UNITS:`organization-units`,ORGANIZATION_UNIT:`organization-unit`,CHILD_ORGANIZATION_UNITS:`child-organization-units`,ORGANIZATION_UNIT_USERS:`organization-unit-users`,ORGANIZATION_UNIT_GROUPS:`organization-unit-groups`};function Lr(e,t){let n=(0,Q.c)(18),{http:r}=D(),{getServerUrl:i}=P(),a;n[0]===t?a=n[1]:(a=t??{},n[0]=t,n[1]=a);let{limit:o,offset:s}=a,c=o===void 0?30:o,l=s===void 0?0:s,u;n[2]!==c||n[3]!==l?(u={limit:c,offset:l},n[2]=c,n[3]=l,n[4]=u):u=n[4];let d;n[5]!==e||n[6]!==u?(d=[Ir.CHILD_ORGANIZATION_UNITS,e,u],n[5]=e,n[6]=u,n[7]=d):d=n[7];let f;n[8]!==i||n[9]!==r||n[10]!==c||n[11]!==l||n[12]!==e?(f=async()=>Pr(r,i(),e,{limit:c,offset:l}),n[8]=i,n[9]=r,n[10]=c,n[11]=l,n[12]=e,n[13]=f):f=n[13];let p=!!e,m;return n[14]!==d||n[15]!==f||n[16]!==p?(m={queryKey:d,queryFn:f,enabled:p},n[14]=d,n[15]=f,n[16]=p,n[17]=m):m=n[17],V(m)}function Rr(e,t){let n=(0,Q.c)(10),r=t===void 0?!0:t,{http:i}=D(),{getServerUrl:a}=P(),o;n[0]===e?o=n[1]:(o=[Ir.ORGANIZATION_UNIT,e],n[0]=e,n[1]=o);let s;n[2]!==a||n[3]!==i||n[4]!==e?(s=async()=>{let t=a();return(await i.request({url:`${t}/organization-units/${encodeURIComponent(e)}`,method:`GET`,headers:{"Content-Type":`application/json`}})).data},n[2]=a,n[3]=i,n[4]=e,n[5]=s):s=n[5];let c=r&&!!e,l;return n[6]!==o||n[7]!==s||n[8]!==c?(l={queryKey:o,queryFn:s,enabled:c},n[6]=o,n[7]=s,n[8]=c,n[9]=l):l=n[9],V(l)}function zr(e,t){let n=(0,Q.c)(14),r=t===void 0?!0:t,{http:i}=D(),{getServerUrl:a}=P(),o;n[0]===e?o=n[1]:(o=e??{},n[0]=e,n[1]=o);let{limit:s,offset:c}=o,l=s===void 0?30:s,u=c===void 0?0:c,d;n[2]!==l||n[3]!==u?(d=[Ir.ORGANIZATION_UNITS,{limit:l,offset:u}],n[2]=l,n[3]=u,n[4]=d):d=n[4];let f;n[5]!==a||n[6]!==i||n[7]!==l||n[8]!==u?(f=async()=>Fr(i,a(),{limit:l,offset:u}),n[5]=a,n[6]=i,n[7]=l,n[8]=u,n[9]=f):f=n[9];let p;return n[10]!==r||n[11]!==d||n[12]!==f?(p={queryKey:d,queryFn:f,enabled:r},n[10]=r,n[11]=d,n[12]=f,n[13]=p):p=n[13],V(p)}var $={PLACEHOLDER_SUFFIX:`__placeholder`,EMPTY_SUFFIX:`__empty`,ERROR_SUFFIX:`__error`,ADD_CHILD_SUFFIX:`__addChild`,LOAD_MORE_SUFFIX:`__loadMore`,ROOT_PARENT_ID:`__root`,ROOT_LOAD_MORE_ID:`__root__loadMore`,PAGE_SIZE:30,DEFAULT_AVATAR:`avatar:shape=rounded,variant=anonymous_entity,content=pavilion,colors=0`};function Br(e,t,n){return e.map(e=>{if(e.id===t){let t=(e.children??[]).filter(e=>!e.id.endsWith($.LOAD_MORE_SUFFIX));return{...e,children:[...t,...n]}}return e.children&&e.children.length>0?{...e,children:Br(e.children,t,n)}:e})}function Vr(e){let t=new Map,n=e=>{e.forEach(e=>{t.set(e.id,e),e.children&&n(e.children)})};return n(e),t}function Hr(e){return e.map(e=>({id:e.id,label:e.name,handle:e.handle,description:e.description,logoUrl:e.logoUrl,isReadOnly:e.isReadOnly,children:[{id:`${e.id}${$.PLACEHOLDER_SUFFIX}`,label:``,handle:``,isPlaceholder:!0}]}))}function Ur(e,t,n){return e.map(e=>e.id===t?{...e,children:n}:e.children&&e.children.length>0?{...e,children:Ur(e.children,t,n)}:e)}function Wr(){return(0,Z.jsx)(v,{size:16})}function Gr(e){let{itemMap:t,loadingItems:n,loadMoreLoadingItems:r,onLoadMore:i,spacious:a,itemId:o,label:s,...c}=e,l=a===void 0?!1:a,u={itemId:o,label:s,...c},d=te(),{t:f}=K(),p=typeof s==`string`?s:``,m=t?.get(o),h=o.endsWith($.LOAD_MORE_SUFFIX),g=o.endsWith($.EMPTY_SUFFIX),_=!g&&!h&&(m?.isPlaceholder??o.endsWith($.PLACEHOLDER_SUFFIX)),y=n?.has(o);if(h){let e=o.replace($.LOAD_MORE_SUFFIX,``),t=r?.has(e);return(0,Z.jsx)(xe,{...u,sx:{"& > .MuiTreeItem-content":{border:`1px dashed`,borderColor:d.vars?.palette.divider,borderRadius:.5,backgroundColor:`transparent !important`,cursor:t?`default`:`pointer`,transition:`all 0.15s ease-in-out`,"&:hover":{borderColor:t?void 0:d.vars?.palette.primary.main}}},label:(0,Z.jsx)(w,{role:`button`,tabIndex:0,onClick:n=>{n.stopPropagation(),t||i?.(e)},onKeyDown:n=>{(n.key===`Enter`||n.key===` `)&&!t&&(n.preventDefault(),n.stopPropagation(),i?.(e))},sx:{display:`flex`,alignItems:`center`,justifyContent:`center`,gap:1,py:.25},children:t?(0,Z.jsxs)(Z.Fragment,{children:[(0,Z.jsx)(v,{size:14}),(0,Z.jsx)(U,{variant:`caption`,color:`text.secondary`,children:f(`common:status.loading`)})]}):(0,Z.jsx)(U,{variant:`caption`,color:`primary`,sx:{fontWeight:500},children:f(`organizationUnits:listing.treeView.loadMore`)})})})}return g?(0,Z.jsx)(xe,{...u,sx:{"& > .MuiTreeItem-content":{border:`none !important`,backgroundColor:`transparent !important`}},label:(0,Z.jsx)(U,{variant:`caption`,color:`text.secondary`,sx:{fontStyle:l?`normal`:`italic`,pl:+!l},children:p})}):_?(0,Z.jsx)(xe,{...u,sx:{"& > .MuiTreeItem-content":{border:`none !important`,backgroundColor:`transparent !important`}},label:(0,Z.jsxs)(w,{sx:{display:`flex`,alignItems:`center`,gap:1},children:[(0,Z.jsx)(v,{size:16}),(0,Z.jsx)(U,{variant:`caption`,color:`text.secondary`,sx:{fontStyle:`italic`},children:f(`common:status.loading`)})]})}):(0,Z.jsx)(xe,{...u,...y?{slots:{collapseIcon:Wr,expandIcon:Wr}}:{},label:(0,Z.jsxs)(w,{sx:{display:`flex`,alignItems:`center`,gap:l?2:1.5},children:[(0,Z.jsx)(Ye,{variant:`rounded`,value:m?.logoUrl,size:l?40:30,fallback:$.DEFAULT_AVATAR}),(0,Z.jsxs)(w,{sx:{flexGrow:1,minWidth:0},children:[(0,Z.jsx)(U,{variant:l?`body1`:`body2`,sx:{fontWeight:600,lineHeight:1.3},children:p}),m?.handle&&(0,Z.jsx)(U,{variant:`caption`,color:`text.secondary`,sx:{lineHeight:1.2,display:`block`},children:m.handle})]})]})})}function Kr({id:e=void 0,value:t,onChange:n,error:r=!1,helperText:i=``,rootOuId:a=void 0,maxHeight:o=300,spacious:s=!1,autoSelectFirst:c=!1}){let l=te(),{t:u}=K(),d=ge(`OrganizationUnitTreePicker`),{http:f}=D(),{getServerUrl:p}=P(),m=N(),{data:h,isLoading:g,error:_,refetch:v}=zr(void 0,!a);(0,X.useEffect)(()=>{if(!c||a||t)return;let e=h?.organizationUnits[0]?.id;e&&n(e)},[c,a,t,h,n]);let{data:y,isLoading:b,error:x,refetch:S}=Rr(a),{data:C,isLoading:T,error:E,refetch:O}=Lr(a),[k,A]=(0,X.useState)([]),[j,M]=(0,X.useState)([]),[F,I]=(0,X.useState)(new Set),[L,R]=(0,X.useState)(new Set),[z,ee]=(0,X.useState)(new Set),[B,ne]=(0,X.useState)(new Map),[re,V]=(0,X.useState)(0),[ie,H]=(0,X.useState)(!1),ae=(0,X.useRef)(!1);ae.current=ie;let oe=(0,X.useRef)(L);oe.current=L;let se=(0,X.useMemo)(()=>Vr(k),[k]);(0,X.useEffect)(()=>{A([]),M([]),I(new Set),R(new Set),ee(new Set),ne(new Map),V(0),H(!1)},[a]),(0,X.useEffect)(()=>{if(!a&&h?.organizationUnits&&h.organizationUnits.length>0&&k.length===0){let e=Hr(h.organizationUnits);h.organizationUnits.length<h.totalResults&&e.push({id:$.ROOT_LOAD_MORE_ID,label:``,handle:``,isPlaceholder:!0}),V(h.organizationUnits.length),A(e)}},[a,h,k.length]),(0,X.useEffect)(()=>{if(!a||!y||!C||k.length>0)return;let e=Hr(C.organizationUnits);C.organizationUnits.length<C.totalResults&&e.push({id:`${a}${$.LOAD_MORE_SUFFIX}`,label:``,handle:``,isPlaceholder:!0});let t=C.organizationUnits.length>0?e:[{id:`${a}${$.EMPTY_SUFFIX}`,label:u(`organizationUnits:listing.treeView.noChildren`),handle:``,isPlaceholder:!0}],n={id:y.id,label:y.name,handle:y.handle,description:y.description??void 0,logoUrl:y.logoUrl,children:t};ne(e=>new Map(e).set(a,C.organizationUnits.length)),I(e=>new Set(e).add(a)),M([a]),A([n])},[a,y,C,k.length,u]);let ce=(0,X.useCallback)(async(e,t)=>m.fetchQuery({queryKey:[Ir.CHILD_ORGANIZATION_UNITS,e,{limit:$.PAGE_SIZE,offset:t}],queryFn:async()=>Pr(f,p(),e,{limit:$.PAGE_SIZE,offset:t}),staleTime:0}),[p,m,f]),le=(0,X.useCallback)((e,t,n)=>{let r=t.organizationUnits;if(r.length===0&&n===0)return[{id:`${e}${$.EMPTY_SUFFIX}`,label:u(`organizationUnits:listing.treeView.noChildren`),handle:``,isPlaceholder:!0}];let i=Hr(r);return n+r.length<t.totalResults&&i.push({id:`${e}${$.LOAD_MORE_SUFFIX}`,label:``,handle:``,isPlaceholder:!0}),i},[u]),ue=(0,X.useCallback)(async e=>{if(!oe.current.has(e)){R(t=>new Set(t).add(e));try{let t=await ce(e,0),n=le(e,t,0);ne(n=>new Map(n).set(e,t.organizationUnits.length)),A(t=>Ur(t,e,n)),I(t=>new Set(t).add(e)),M(t=>t.includes(e)?t:[...t,e])}catch(t){d.error(`Failed to load child organization units`,{error:t,parentId:e})}finally{R(t=>{let n=new Set(t);return n.delete(e),n})}}},[ce,le,d]),de=(0,X.useCallback)(async()=>{if(!ae.current){H(!0);try{let e=await m.fetchQuery({queryKey:[Ir.ORGANIZATION_UNITS,{limit:$.PAGE_SIZE,offset:re}],queryFn:async()=>Fr(f,p(),{limit:$.PAGE_SIZE,offset:re}),staleTime:0}),t=Hr(e.organizationUnits),n=re+e.organizationUnits.length;n<e.totalResults&&t.push({id:$.ROOT_LOAD_MORE_ID,label:``,handle:``,isPlaceholder:!0}),V(n),A(e=>[...e.filter(e=>e.id!==$.ROOT_LOAD_MORE_ID),...t])}catch(e){d.error(`Failed to load more root organization units`,{error:e})}finally{H(!1)}}},[re,p,m,f,d]),W=(0,X.useCallback)(async e=>{if(e===$.ROOT_PARENT_ID){await de();return}ee(t=>new Set(t).add(e));try{let t=B.get(e)??$.PAGE_SIZE,n=await ce(e,t),r=le(e,n,t);ne(r=>new Map(r).set(e,t+n.organizationUnits.length)),A(t=>Br(t,e,r))}catch(t){d.error(`Failed to load more child organization units`,{error:t,parentId:e})}finally{ee(t=>{let n=new Set(t);return n.delete(e),n})}},[B,ce,le,d,de]),G=(0,X.useMemo)(()=>{if(!ie)return z;let e=new Set(z);return e.add($.ROOT_PARENT_ID),e},[z,ie]),fe=(0,X.useCallback)((e,t,n)=>{!n||F.has(t)||L.has(t)||ue(t).catch(e=>{d.error(`Failed to load child organization units`,{error:e,parentId:t})})},[F,L,ue,d]),pe=(0,X.useCallback)((e,t)=>{t&&!t.endsWith($.PLACEHOLDER_SUFFIX)&&!t.endsWith($.EMPTY_SUFFIX)&&!t.endsWith($.LOAD_MORE_SUFFIX)&&n(t)},[n]),me=(0,X.useCallback)((e,t)=>{let n=new Set(j);M(t.filter(e=>n.has(e)||F.has(e)))},[j,F]),he=(0,X.useCallback)(e=>{W(e).catch(t=>{d.error(`Failed to load more child organization units`,{error:t,parentId:e})})},[W,d]),_e=a?b||T:g,ve=a?x??E:_;return _e?(0,Z.jsx)(Ce,{}):ve?(0,Z.jsx)(tt,{error:ve,t:(e,t)=>u(e.includes(`:`)?e:`organizationUnits:${e}`,t),variant:`inline`,fallbackKey:`organizationUnits:treePicker.error`,fallbackDefaultValue:`Failed to load organization unit data`,onRetry:()=>{a?(x&&S(),E&&O()):v()}}):!a&&h?.organizationUnits.length===0?(0,Z.jsx)(U,{variant:`body2`,color:`text.secondary`,children:u(`organizationUnits:treePicker.empty`)}):(0,Z.jsxs)(w,{children:[(0,Z.jsx)(w,{sx:{maxHeight:o,overflow:`auto`},children:(0,Z.jsx)(Ae,{id:e,items:k,expandedItems:j,onExpandedItemsChange:me,onItemExpansionToggle:fe,selectedItems:t||null,onSelectedItemsChange:pe,slots:{item:Gr},slotProps:{item:{itemMap:se,loadingItems:L,loadMoreLoadingItems:G,onLoadMore:he,spacious:s}},getItemLabel:e=>e.label,sx:s?{"& .MuiTreeItem-content":{cursor:`pointer`,border:`1.5px solid`,borderColor:l.vars?.palette.divider,borderRadius:`14px`,bgcolor:l.vars?.palette.background.paper,py:`18px`,px:`20px`,mb:1.5,transition:`border-color 0.2s, background-color 0.2s`,"&:hover":{borderColor:l.vars?.palette.text.secondary}},"& .Mui-selected > .MuiTreeItem-content":{backgroundColor:`${l.vars?.palette.primary.main}1f`,borderColor:l.vars?.palette.primary.main},"& .MuiTreeItem-iconContainer":{color:l.vars?.palette.text.secondary,mr:.75},"& .MuiTreeItem-groupTransition":{ml:2.5,pl:2,borderLeft:`1px dashed`,borderColor:l.vars?.palette.divider}}:{"& .MuiTreeItem-content":{cursor:`pointer`,border:`1px solid`,borderColor:l.vars?.palette.divider,borderRadius:.5,py:.75,px:1,mb:.5,transition:`all 0.15s ease-in-out`,"&:hover":{backgroundColor:l.vars?.palette.action.hover,borderColor:l.vars?.palette.primary.main}},"& .Mui-selected > .MuiTreeItem-content":{backgroundColor:`${l.vars?.palette.primary.main}14`,borderColor:l.vars?.palette.primary.main},"& .MuiTreeItem-iconContainer":{color:l.vars?.palette.text.secondary,mr:.5},"& .MuiTreeItem-groupTransition":{ml:2,pl:2,borderLeft:`1px dashed`,borderColor:l.vars?.palette.divider}}})}),i&&(0,Z.jsx)(U,{variant:`caption`,color:r?`error`:`text.secondary`,sx:{mt:.5,ml:1.75},children:i})]})}function qr(e,t,n){let r=e.find(e=>(String(e.type)===String(m.Text)||e.type===`TEXT`)&&e.variant===`HEADING_1`&&typeof e.label==`string`);return r&&typeof r.label==`string`?n(t(r.label)??r.label):``}var Jr=`FLM-1003`;function Yr(e){return e?.toLowerCase().includes(`flow not found`)??!1}function Xr(e){if(!e||typeof e!=`object`)return!1;let t=e,{response:n}=t,r=n?.data;return r?.code===Jr||t.code===Jr||t.error?.code===Jr||Yr(r?.message)||Yr(r?.description)||Yr(t.message)||Yr(t.error?.message?.defaultValue)||Yr(t.error?.description?.defaultValue)}var Zr=e=>{if(typeof e==`string`)return e;if(typeof e==`object`&&e&&`value`in e){let{value:t}=e;return typeof t==`string`?t:JSON.stringify(t??e)}return JSON.stringify(e)};function Qr(e){return e.some(e=>e.ref!=null||e.eventType!=null||Array.isArray(e.components)&&Qr(e.components))}var $r=e=>{if(typeof e==`string`)return e;if(typeof e==`object`&&e&&`label`in e){let{label:t}=e;return typeof t==`string`?t:JSON.stringify(t??e)}return JSON.stringify(e)};function ei({renderProps:e,flowError:t,handleClose:r,onResetLocalState:i,onClearFlowError:a}){let{additionalData:o,values:s,error:c,isLoading:l,components:u,handleInputChange:h,handleSubmit:_,resetFlow:b,isValid:x}=e,{resolveFlowTemplateLiterals:S}=D(),T=(0,X.useCallback)(e=>e?S(e):void 0,[S]),{t:O}=K(),[k,A]=(0,X.useState)(null),M=(0,X.useCallback)((e,t)=>{a(),h(e,t)},[h,a]),N=(0,X.useMemo)(()=>e=>{let t={},n=e=>{e.forEach(e=>{if((String(e.type)===String(m.Block)||e.type===`BLOCK`)&&e.components)n(e.components);else if((String(e.type)===String(m.TextInput)||e.type===`TEXT_INPUT`||e.type===`EMAIL_INPUT`||e.type===`PHONE_INPUT`||e.type===`PASSWORD_INPUT`||e.type===`SELECT`||e.type===`BOOLEAN_INPUT`||e.type===`NUMBER_INPUT`||e.type===`OU_SELECT`)&&e.ref){let n=st();e.type===`EMAIL_INPUT`?n=st().email(`Please enter a valid email address`):e.type===`PHONE_INPUT`?n=st().regex(/^\+?[0-9\s\-().]{7,20}$/,`Please enter a valid phone number`):e.type===`PASSWORD_INPUT`&&(n=st());let r=typeof e.label==`string`?e.label:e.ref;if(e.type===`BOOLEAN_INPUT`){t[e.ref]=n;return}n=e.required?n.min(1,`${O(T(r)??r)??e.ref} is required`):n.optional(),t[e.ref]=n}})};return n(e),lt(t)},[O,T]),P=(0,X.useMemo)(()=>u?.length?N(u):lt({}),[u,N]),F=(e,t,r,i,a,s)=>{let{type:c,ref:l,label:u,placeholder:h,required:g,options:_,hint:v}=e;if(!l)return null;let y=typeof u==`string`?u:``,b=typeof h==`string`?h:``;return String(c)===String(m.TextInput)||c===`TEXT_INPUT`||c===`NUMBER_INPUT`?(0,Z.jsxs)(C,{required:g,children:[(0,Z.jsx)(f,{htmlFor:l,children:T(y)??y}),(0,Z.jsx)(ft,{name:l,control:r,rules:{required:g?`${T(y)??y} is required`:!1},render:({field:e})=>(0,Z.jsx)(j,{...e,fullWidth:!0,size:`small`,id:l,type:c===`NUMBER_INPUT`?`number`:`text`,placeholder:T(b)??b,autoComplete:`off`,required:g,variant:`outlined`,disabled:a,error:!!i[l],helperText:i[l]?.message,color:i[l]?`error`:`primary`,onChange:t=>{e.onChange(t),s(l,t.target.value)}})})]},e.id??t):c===`EMAIL_INPUT`?(0,Z.jsxs)(C,{required:g,children:[(0,Z.jsx)(f,{htmlFor:l,children:T(y)??y}),(0,Z.jsx)(ft,{name:l,control:r,rules:{required:g?`${T(y)??y} is required`:!1,pattern:{value:me,message:O(`validations:field.email.invalid`,`Please enter a valid email address.`)}},render:({field:e})=>(0,Z.jsx)(j,{...e,fullWidth:!0,size:`small`,id:l,type:`email`,placeholder:T(b)??b,autoComplete:`email`,required:g,variant:`outlined`,disabled:a,error:!!i[l],helperText:i[l]?.message,color:i[l]?`error`:`primary`,onChange:t=>{e.onChange(t),s(l,t.target.value)}})})]},e.id??t):c===`PHONE_INPUT`?(0,Z.jsxs)(C,{required:g,children:[(0,Z.jsx)(f,{htmlFor:l,children:T(y)??y}),(0,Z.jsx)(ft,{name:l,control:r,rules:{required:g?`${T(y)??y} is required`:!1},render:({field:e})=>(0,Z.jsx)(j,{...e,fullWidth:!0,size:`small`,id:l,type:`tel`,placeholder:T(b)??b,autoComplete:`tel`,required:g,variant:`outlined`,disabled:a,error:!!i[l],helperText:i[l]?.message,color:i[l]?`error`:`primary`,onChange:t=>{e.onChange(t),s(l,t.target.value)}})})]},e.id??t):c===`PASSWORD_INPUT`?(0,Z.jsxs)(C,{required:g,children:[(0,Z.jsx)(f,{htmlFor:l,children:T(y)??y}),(0,Z.jsx)(ft,{name:l,control:r,rules:{required:g?`${T(y)??y} is required`:!1},render:({field:e})=>(0,Z.jsx)(br,{id:l,name:e.name,value:e.value??``,placeholder:T(b)??b,required:g??!1,error:!!i[l],helperText:i[l]?.message,color:i[l]?`error`:`primary`,ariaLabel:T(y)??y,onChange:t=>{e.onChange(t),s(l,t.target.value)},onBlur:e.onBlur,inputRef:e.ref})})]},e.id??t):c===`BOOLEAN_INPUT`?(0,Z.jsxs)(C,{required:g,children:[(0,Z.jsx)(ft,{name:l,control:r,render:({field:e})=>(0,Z.jsx)(d,{control:(0,Z.jsx)(n,{id:l,size:`small`,disabled:a,checked:e.value===`true`,onChange:t=>{let n=String(t.target.checked);e.onChange(n),s(l,n)}}),label:T(y)??y})}),v&&(0,Z.jsx)(U,{variant:`caption`,color:`text.secondary`,children:v})]},e.id??t):c===`OU_SELECT`?(0,Z.jsxs)(C,{fullWidth:!0,required:g,children:[(0,Z.jsx)(f,{htmlFor:l,children:T(y)??y}),(0,Z.jsx)(ft,{name:l,control:r,rules:{required:g?`${T(y)??y} is required`:!1},render:({field:e})=>(0,Z.jsx)(Kr,{value:e.value??``,onChange:t=>{e.onChange(t),s(l,t)},rootOuId:o?.rootOuId})}),i[l]&&(0,Z.jsx)(U,{variant:`caption`,color:`error`,children:i[l]?.message})]},e.id??t):c===`SELECT`&&_?(0,Z.jsxs)(C,{fullWidth:!0,required:g,children:[(0,Z.jsx)(f,{htmlFor:l,children:T(y)??y}),(0,Z.jsx)(ft,{name:l,control:r,rules:{required:g?`${T(y)??y} is required`:!1},render:({field:e})=>(0,Z.jsxs)(Z.Fragment,{children:[(0,Z.jsxs)(R,{...e,value:e.value??``,displayEmpty:!0,size:`small`,id:l,required:g,fullWidth:!0,disabled:a,error:!!i[l],onChange:t=>{e.onChange(t),s(l,String(t.target.value))},renderValue:e=>{if(!e||e===``)return(0,Z.jsx)(U,{sx:{color:`text.secondary`},children:T(b)??`Select an option`});let t=_.find(t=>Zr(t)===e);return t?$r(t):String(e)},children:[(0,Z.jsx)(p,{value:``,disabled:!0,children:T(b)??`Select an option`}),_.map(e=>(0,Z.jsx)(p,{value:Zr(e),children:$r(e)},Zr(e)))]}),i[l]&&(0,Z.jsx)(U,{variant:`caption`,color:`error.main`,sx:{mt:.5},children:i[l]?.message}),v&&(0,Z.jsx)(U,{variant:`caption`,color:`text.secondary`,children:v})]})})]},e.id??t):null},{control:I,formState:{errors:L,isValid:z},reset:ee,setValue:te}=ct({resolver:dt(P),mode:`onChange`,defaultValues:s??{}});if((0,X.useEffect)(()=>{!u?.length&&Object.keys(s??{}).length===0&&ee({})},[u,s,ee]),(0,X.useEffect)(()=>{if(!u?.length)return;let e=t=>{let n=[];for(let r of t)r.type===`BOOLEAN_INPUT`&&r.ref&&n.push(r.ref),r.components&&n.push(...e(r.components));return n};e(u).forEach(e=>{s?.[e]===void 0&&(te(e,`false`,{shouldValidate:!0}),h(e,`false`))})},[u,s,te,h]),(0,X.useEffect)(()=>{let e=o?.rootOuId;if(!e||!u?.length)return;let t=e=>{for(let n of e){if(n.type===`OU_SELECT`&&n.ref)return n.ref;if(n.components){let e=t(n.components);if(e)return e}}return null},n=t(u);n&&!s?.[n]&&(te(n,e,{shouldValidate:!0}),h(n,e))},[o,u,s,te,h]),l&&!u?.length)return(0,Z.jsx)(Ce,{});if(c&&!u?.length)return(0,Z.jsxs)(w,{children:[(0,Z.jsxs)(E,{severity:`error`,sx:{mb:2},children:[(0,Z.jsx)(He,{children:O(`users:errors.failed.title`,`Error`)}),Tr(c,(e,t)=>O(e.includes(`:`)?e:`users:${e}`,t),`errors.failed.description`,`An error occurred. Please try again.`)]}),(0,Z.jsx)(w,{sx:{display:`flex`,justifyContent:`flex-end`},children:(0,Z.jsx)(H,{variant:`outlined`,onClick:r,children:O(`common:actions.close`,`Close`)})})]});if(!u?.length)return(0,Z.jsx)(Ce,{});let ne=Qr(u);return(0,Z.jsxs)(Z.Fragment,{children:[(t??c)&&(0,Z.jsxs)(E,{severity:`error`,sx:{mb:2},children:[(0,Z.jsx)(He,{children:O(`users:errors.failed.title`,`Error`)}),t??(c&&Tr(c,(e,t)=>O(e.includes(`:`)?e:`users:${e}`,t),`errors.failed.description`,`An error occurred. Please try again.`))]}),(0,Z.jsx)(y,{direction:`column`,spacing:4,children:u.map((e,t)=>{if(String(e.type)===String(m.Text)||e.type===`TEXT`){let n=typeof e.variant==`string`?e.variant:void 0,r=typeof e.label==`string`?e.label:``,i=e,a=i.align,o=De(typeof i.color==`string`?i.color:void 0)??(n===`HEADING_1`?void 0:`textSecondary`);return n===`HEADING_1`?(0,Z.jsx)(U,{variant:`h1`,gutterBottom:!0,textAlign:a,color:o,children:T(r)??r},e.id??t):(0,Z.jsx)(U,{variant:n===`HEADING_2`?`h2`:`body1`,color:o,textAlign:a,children:T(r)??r},e.id??t)}if(e.type===`COPYABLE_TEXT`)return(0,Z.jsx)(Oe,{component:e,resolve:T,additionalData:o},e.id??t);if(String(e.type)===String(m.Block)||e.type===`BLOCK`){let n=e.components??[],r=e=>(String(e.type)===String(m.Action)||e.type===`ACTION`)&&(String(e.eventType)===String(g.Submit)||e.eventType===`SUBMIT`),i=n.filter(r),a=n.flatMap(e=>e.type===`STACK`?(e.components??[]).filter(r):[]),o=i[0]??a[0];if(!o)return null;let c=l||!z||x!==void 0&&!x;return(0,Z.jsx)(w,{component:`form`,onSubmit:e=>{e.preventDefault(),c||_(o,s).catch(()=>void 0)},noValidate:!0,sx:{display:`flex`,flexDirection:`column`,width:`100%`,gap:2},children:n.map((e,t)=>{let n=F(e,t,I,L,l,M);if(n)return n;if(e.type===`STACK`){let n=(e.components??[]).filter(r),i=e.direction??`row`,a=e.justify??`center`;if(e.id===`stack_onboarding_mode_actions`){let r=e=>e===`action_create_user_now`?{icon:(0,Z.jsx)(Le,{size:28}),descriptionKey:`onboarding:forms.onboarding_mode.actions.create.description`,descriptionDefault:`Create user account immediately with all details`}:e===`action_invite_user`?{icon:(0,Z.jsx)(Ne,{size:28}),descriptionKey:`onboarding:forms.onboarding_mode.actions.invite.description`,descriptionDefault:`Send invitation for user to complete their profile`}:{icon:null,descriptionKey:``,descriptionDefault:``};return(0,Z.jsx)(y,{direction:i,spacing:2,justifyContent:a,flexWrap:`wrap`,sx:{mt:2},children:n.map((e,t)=>{let n=e.id??String(t),i=typeof e.label==`string`?e.label:``,a=l&&k===n,o=r(e.id);return(0,Z.jsx)(B,{variant:`outlined`,sx:{flex:1,minWidth:200},children:(0,Z.jsx)(Ue,{disabled:c,onClick:()=>{c||(A(n),_(e,s).catch(()=>void 0))},sx:{height:`100%`,p:2,transition:`all 0.2s ease-in-out`,'&:hover:not([aria-disabled="true"])':{borderColor:`primary.main`,bgcolor:`action.hover`}},children:(0,Z.jsx)(ce,{sx:{p:0,"&:last-child":{pb:0}},children:(0,Z.jsxs)(y,{direction:`column`,spacing:1.5,alignItems:`flex-start`,children:[o.icon&&(0,Z.jsx)(w,{sx:{color:`text.secondary`},children:o.icon}),(0,Z.jsxs)(y,{direction:`column`,spacing:.5,children:[(0,Z.jsx)(U,{variant:`subtitle1`,sx:{fontWeight:500},children:a?(0,Z.jsx)(v,{size:16,color:`inherit`}):T(i)??i}),o.descriptionKey&&(0,Z.jsx)(U,{variant:`body2`,color:`text.secondary`,children:O(o.descriptionKey,o.descriptionDefault)})]})]})})})},n)})},e.id??t)}return(0,Z.jsx)(y,{direction:i,spacing:2,justifyContent:a,flexWrap:`wrap`,sx:{mt:2},children:n.map((e,t)=>{let n=e.id??String(t),r=typeof e.label==`string`?e.label:``,i=l&&k===n;return(0,Z.jsx)(H,{type:`button`,variant:e.variant===`PRIMARY`?`contained`:`outlined`,disabled:c,onClick:()=>{c||(A(n),_(e,s).catch(()=>void 0))},children:i?(0,Z.jsx)(v,{size:16,color:`inherit`}):T(r)??r},n)})},e.id??t)}if(!r(e))return null;let i=typeof e.label==`string`?e.label:``;return(0,Z.jsx)(y,{direction:`row`,spacing:2,justifyContent:`flex-end`,sx:{mt:4},children:(0,Z.jsx)(H,{type:`button`,variant:e.variant===`PRIMARY`?`contained`:`outlined`,disabled:c,sx:{minWidth:140},onClick:()=>{c||_(e,s).catch(()=>void 0)},children:l?(0,Z.jsx)(v,{size:20,color:`inherit`}):T(i)??i})},e.id??t)})},e.id??t)}return null})}),!ne&&(0,Z.jsxs)(y,{direction:`row`,spacing:2,justifyContent:`flex-start`,sx:{mt:4},children:[(0,Z.jsx)(H,{variant:`outlined`,onClick:r,children:O(`common:actions.close`,`Close`)}),(0,Z.jsx)(H,{variant:`contained`,onClick:()=>{b(),i()},children:O(`users:addAnother`,`Add Another User`)})]})]})}function ti({renderProps:e,flowError:t,handleClose:n,onStepLabelChange:r,onInviteComplete:i,onOuStepDetected:a,onResetLocalState:o,onClearFlowError:s,onResetFlowAvailable:c=void 0}){let{resolveFlowTemplateLiterals:l}=D(),u=(0,X.useCallback)(e=>e?l(e):void 0,[l]),{t:d}=K(),f=e.components,p=f?.length?qr(f,u,d):``,m=!!f?.length&&!Qr(f),h=f?.some(e=>e.type===`OU_SELECT`||e.components?.some(e=>e.type===`OU_SELECT`))??!1;return(0,X.useEffect)(()=>{c&&e.resetFlow&&c(e.resetFlow)},[c,e.resetFlow]),(0,X.useEffect)(()=>{h&&a()},[h,a]),(0,X.useEffect)(()=>{p&&r(p)},[p,r]),(0,X.useEffect)(()=>{m&&i()},[m,i]),(0,Z.jsx)(ei,{renderProps:e,flowError:t,handleClose:n,onResetLocalState:o,onClearFlowError:s})}function ni(){let{t:e}=K(),t=it(),n=ge(`UserAddPage`),r=Ar(),[i,a]=(0,X.useState)(null),o=(0,X.useRef)(null),[s,c]=(0,X.useState)([e(`users:addUser`,`Add User`)]),l=(0,X.useRef)(``),[u,d]=(0,X.useState)(!1),f=(0,X.useCallback)(()=>{Promise.resolve(t(-1)).catch(e=>{n.error(`Failed to navigate back`,{error:e})})},[t,n]),p=(0,X.useCallback)(()=>{n.info(`Falling back to manual user creation because the onboarding flow is unavailable`),(async()=>{await t(r.addCreate())})().catch(e=>{n.error(`Failed to navigate to fallback user creation page`,{error:e})})},[t,r,n]),m=(0,X.useCallback)(e=>{e!==l.current&&(l.current=e,c(t=>{let n=t.indexOf(e);return n>=0?t.slice(0,n+1):[...t,e]}))},[c]),h=(0,X.useCallback)(()=>{l.current!==`complete`&&(l.current=`complete`,c(t=>[...t,e(`users:invite.steps.complete`,`Complete`)]))},[c,e]),g=(0,X.useCallback)(()=>{d(!0)},[]),_=(0,X.useCallback)(()=>{a(null)},[]),v=(0,X.useCallback)(()=>{c([e(`users:addUser`,`Add User`)]),l.current=``,d(!1),a(null)},[e]),y=u?5:4;return(0,Z.jsx)(Qe,{onClose:f,progress:Math.min(s.length/y*100,100),breadcrumbItems:s.map((e,t)=>{let n=t===0;return{key:`breadcrumb-${t}`,label:e,onClick:n?()=>{o.current&&(o.current(),v())}:void 0,disabled:!n}}),footer:null,children:(0,Z.jsx)($n,{onError:t=>{if(Xr(t)){p();return}n.error(`User onboarding error`,{error:t}),a(n=>n??Tr(t,(t,n)=>e(t.includes(`:`)?t:`users:${t}`,n),`errors.failed.description`,`An error occurred. Please try again.`))},onFlowChange:t=>{if(Xr(t)){p();return}if(!t?.error){a(null);return}a(Tr(t,(t,n)=>e(t.includes(`:`)?t:`users:${t}`,n),`errors.failed.description`,`An error occurred. Please try again.`))},children:e=>(0,Z.jsx)(ti,{renderProps:e,flowError:i,handleClose:f,onStepLabelChange:m,onInviteComplete:h,onOuStepDetected:g,onResetLocalState:v,onClearFlowError:_,onResetFlowAvailable:e=>{o.current=e}})})})}var ri=`action_create_user_now`;function ii(e){let t=[];return e.forEach(e=>{e.type===`BOOLEAN_INPUT`&&typeof e.ref==`string`&&t.push(e.ref);let n=e.components;n&&t.push(...ii(n))}),t}function ai(e){let t=(0,Q.c)(33),{renderProps:r,error:i,onFieldChange:a,onStepLabelChange:o}=e,{resolveFlowTemplateLiterals:s}=D(),c;t[0]===s?c=t[1]:(c=e=>e?s(e):void 0,t[0]=s,t[1]=c);let l=c,{t:u}=K(),h=r.components,g;t[2]===h?g=t[3]:(g=h?.find(ui),t[2]=h,t[3]=g);let _=g,v=(0,X.useRef)(void 0),b,x;t[4]!==_||t[5]!==r?(b=()=>{_&&v.current!==_.id&&(v.current=_.id,r.handleSubmit(_,r.values).catch(li))},x=[_,r],t[4]=_,t[5]=r,t[6]=b,t[7]=x):(b=t[6],x=t[7]),(0,X.useEffect)(b,x);let S;t[8]===h?S=t[9]:(S=h?.find(ci),t[8]=h,t[9]=S);let w=S,T,O;t[10]!==o||t[11]!==l||t[12]!==w||t[13]!==u?(T=()=>{w&&typeof w.label==`string`&&o(u(l(w.label)??w.label))},O=[w,l,u,o],t[10]=o,t[11]=l,t[12]=w,t[13]=u,t[14]=T,t[15]=O):(T=t[14],O=t[15]),(0,X.useEffect)(T,O);let{values:k,additionalData:A,handleInputChange:M}=r,N;t[16]!==a||t[17]!==M?(N=(e,t)=>{a(),M(e,t)},t[16]=a,t[17]=M,t[18]=N):N=t[18];let P=N,F,I;t[19]!==h||t[20]!==M||t[21]!==k?(I=()=>{if(!h?.length)return;let e=k;ii(h).forEach(t=>{e?.[t]===void 0&&M(t,`false`)})},F=[h,k,M],t[19]=h,t[20]=M,t[21]=k,t[22]=F,t[23]=I):(F=t[22],I=t[23]),(0,X.useEffect)(I,F);let L;if(t[24]!==A?.rootOuId||t[25]!==h||t[26]!==i||t[27]!==P||t[28]!==r||t[29]!==l||t[30]!==u||t[31]!==k){let e=(t,i)=>{if(String(t.type)===String(m.Text)||t.type===`TEXT`){let e=typeof t.label==`string`?t.label:``;return t.variant===`HEADING_1`?(0,Z.jsx)(U,{variant:`h1`,gutterBottom:!0,children:u(l(e)??e)},t.id??i):(0,Z.jsx)(U,{variant:`body1`,color:`text.secondary`,children:u(l(e)??e)},t.id??i)}if(t.type===`EMAIL_INPUT`||t.type===`TEXT_INPUT`||t.type===`PHONE_INPUT`||t.type===`NUMBER_INPUT`||t.type===`PASSWORD_INPUT`){let e=t.ref,n=typeof t.label==`string`?t.label:``,r=t.placeholder??``,a=t.required??!1;if(!e)return null;let o=k?.[e]??``,s=`text`;return t.type===`EMAIL_INPUT`&&(s=`email`),t.type===`PASSWORD_INPUT`&&(s=`password`),t.type===`PHONE_INPUT`&&(s=`tel`),t.type===`NUMBER_INPUT`&&(s=`number`),(0,Z.jsxs)(C,{fullWidth:!0,required:a,children:[(0,Z.jsx)(f,{htmlFor:e,children:u(l(n)??n)}),(0,Z.jsx)(j,{id:e,type:s,size:`small`,variant:`outlined`,placeholder:l(r)??r,value:o,required:a,onChange:t=>P(e,t.target.value)})]},t.id??i)}if(t.type===`SELECT`){let e=t.ref,n=typeof t.label==`string`?t.label:``,r=t.options??[],a=t.required??!1;if(!e||!r.length)return null;let o=k?.[e]??``;return(0,Z.jsxs)(C,{fullWidth:!0,required:a,children:[(0,Z.jsx)(f,{htmlFor:e,children:u(l(n)??n)}),(0,Z.jsxs)(R,{id:e,value:o,size:`small`,displayEmpty:!0,required:a,onChange:t=>P(e,String(t.target.value)),children:[(0,Z.jsx)(p,{value:``,children:u(`Select an option`)}),r.map(si)]})]},t.id??i)}if(t.type===`BOOLEAN_INPUT`){let e=t.ref,r=typeof t.label==`string`?t.label:``,a=t.required??!1;return e?(0,Z.jsx)(C,{required:a,children:(0,Z.jsx)(d,{control:(0,Z.jsx)(n,{id:e,size:`small`,checked:k?.[e]===`true`,onChange:t=>P(e,String(t.target.checked))}),label:u(l(r)??r)})},t.id??i):null}if(t.type===`OU_SELECT`){let e=t.ref,n=typeof t.label==`string`?t.label:``,r=t.required??!1;if(!e)return null;let a=k?.[e]??``,o=A?.rootOuId;return(0,Z.jsxs)(C,{fullWidth:!0,required:r,children:[(0,Z.jsx)(f,{htmlFor:e,children:u(l(n)??n)}),(0,Z.jsx)(Kr,{value:a,onChange:t=>P(e,t),rootOuId:o})]},t.id??i)}if(t.type===`ACTION`){let e=typeof t.label==`string`?t.label:``,n=t.variant;return(0,Z.jsx)(H,{variant:n===`OUTLINED`?`outlined`:`contained`,onClick:()=>{r.handleSubmit(t,r.values).catch(oi)},fullWidth:!0,size:`large`,children:u(l(e)??e)},t.id??i)}if(t.components){let n=t.components;return(0,Z.jsx)(y,{direction:`column`,spacing:2,children:n.map((t,n)=>e(t,n))},t.id??i)}return null};L=(0,Z.jsxs)(y,{direction:`column`,spacing:4,children:[i&&(0,Z.jsxs)(E,{severity:`error`,children:[(0,Z.jsx)(He,{children:u(`users:errors.failed.title`,`Error`)}),i]}),h?.map((t,n)=>e(t,n))]}),t[24]=A?.rootOuId,t[25]=h,t[26]=i,t[27]=P,t[28]=r,t[29]=l,t[30]=u,t[31]=k,t[32]=L}else L=t[32];return L}function oi(){}function si(e){let t=typeof e==`object`&&e?e.value:e,n=typeof e==`object`&&e?e.label:e,r=String(t);return(0,Z.jsx)(p,{value:r,children:String(n)},r)}function ci(e){return(String(e.type)===String(m.Text)||e.type===`TEXT`)&&e.variant===`HEADING_1`}function li(){}function ui(e){return e.id===ri}function di(){let e=(0,Q.c)(19),{t}=K(),n=it(),r=Ar(),i=ge(`UserCreatePage`),a;e[0]===Symbol.for(`react.memo_cache_sentinel`)?(a=[],e[0]=a):a=e[0];let[o,s]=(0,X.useState)(a),[c,l]=(0,X.useState)(null),u;e[1]!==i||e[2]!==n||e[3]!==r?(u=()=>{Promise.resolve(n(r.list())).catch(e=>{i.error(`Failed to navigate to users page`,{error:e})})},e[1]=i,e[2]=n,e[3]=r,e[4]=u):u=e[4];let d=u,f;e[5]===t?f=e[6]:(f=e=>{s([t(`users:addUser`,`Add User`),e])},e[5]=t,e[6]=f);let p=f,m;e[7]!==i||e[8]!==t?(m=e=>{i.error(`Failed to create user`,{error:e}),l(Tr(e,(e,n)=>t(e.includes(`:`)?e:`users:${e}`,n),`errors.failed.description`,`An error occurred. Please try again.`))},e[7]=i,e[8]=t,e[9]=m):m=e[9];let h=m,g;if(e[10]!==o||e[11]!==c||e[12]!==d||e[13]!==h||e[14]!==p){let t;e[16]!==c||e[17]!==p?(t=e=>(0,Z.jsx)(ai,{renderProps:e,error:c,onFieldChange:()=>l(null),onStepLabelChange:p}),e[16]=c,e[17]=p,e[18]=t):t=e[18],g=(0,Z.jsx)(Qe,{onClose:d,progress:0,breadcrumbItems:o.map(fi),footer:null,children:(0,Z.jsx)($n,{onError:h,children:t})}),e[10]=o,e[11]=c,e[12]=d,e[13]=h,e[14]=p,e[15]=g}else g=e[15];return g}function fi(e,t){return{key:`breadcrumb-${t}`,label:e}}var pi=(e,t,r,i,a)=>{let o=t.required??!1,s=e;if(t.displayName){let e=a?.(t.displayName);s=(e===``?void 0:e)??t.displayName}if(t.type===`string`){let n=t;if(n.enum&&n.enum.length>0){let t=n.enum;return(0,Z.jsxs)(C,{children:[(0,Z.jsxs)(f,{htmlFor:e,children:[s,o&&(0,Z.jsx)(`span`,{style:{color:`red`},children:` *`})]}),(0,Z.jsx)(ft,{name:e,control:r,rules:{required:o?`${s} is required`:!1},render:({field:n})=>(0,Z.jsxs)(R,{...n,value:n.value??``,id:e,fullWidth:!0,required:o,error:!!i[e],displayEmpty:!0,children:[(0,Z.jsx)(p,{value:``,children:(0,Z.jsxs)(`em`,{children:[`Select `,s]})}),t.map(e=>(0,Z.jsx)(p,{value:e,children:e.charAt(0).toUpperCase()+e.slice(1)},e))]})}),i[e]&&(0,Z.jsx)(U,{variant:`caption`,color:`error`,sx:{mt:.5,ml:1.75},children:i[e]?.message})]},e)}let a;return n.regex&&(a={value:new RegExp(n.regex),message:`${s} format is invalid`}),(0,Z.jsxs)(C,{children:[(0,Z.jsxs)(f,{htmlFor:e,children:[s,o&&(0,Z.jsx)(`span`,{style:{color:`red`},children:` *`})]}),(0,Z.jsx)(ft,{name:e,control:r,rules:{required:o?`${s} is required`:!1,pattern:a},render:({field:t})=>n.credential?(0,Z.jsx)(br,{id:e,name:t.name,value:t.value??``,placeholder:`Enter ${s.toLowerCase()}`,required:o,error:!!i[e],helperText:i[e]?.message,color:i[e]?`error`:`primary`,onChange:t.onChange,onBlur:t.onBlur,inputRef:t.ref}):(0,Z.jsx)(j,{...t,value:t.value??``,id:e,type:`text`,placeholder:`Enter ${s.toLowerCase()}`,fullWidth:!0,required:o,variant:`outlined`,error:!!i[e],helperText:i[e]?.message,color:i[e]?`error`:`primary`})})]},e)}if(t.type===`number`){let n=t;return(0,Z.jsxs)(C,{children:[(0,Z.jsxs)(f,{htmlFor:e,children:[s,o&&(0,Z.jsx)(`span`,{style:{color:`red`},children:` *`})]}),(0,Z.jsx)(ft,{name:e,control:r,rules:{required:o?`${s} is required`:!1},render:({field:t})=>n.credential?(0,Z.jsx)(br,{id:e,name:t.name,value:String(t.value??``),placeholder:`Enter ${s.toLowerCase()}`,required:o,error:!!i[e],helperText:i[e]?.message,color:i[e]?`error`:`primary`,onChange:e=>{let{value:n}=e.target,r=Number(n);t.onChange(n&&!Number.isNaN(r)?r:``)},onBlur:t.onBlur,inputRef:t.ref}):(0,Z.jsx)(j,{...t,value:t.value??``,id:e,type:`number`,placeholder:`Enter ${s.toLowerCase()}`,fullWidth:!0,required:o,variant:`outlined`,error:!!i[e],helperText:i[e]?.message,color:i[e]?`error`:`primary`,onChange:e=>{let{value:n}=e.target;t.onChange(n?Number(n):``)}})})]},e)}return t.type===`boolean`?(0,Z.jsx)(C,{children:(0,Z.jsx)(ft,{name:e,control:r,render:({field:t})=>(0,Z.jsx)(w,{sx:{display:`flex`,alignItems:`center`,py:1},children:(0,Z.jsx)(d,{control:(0,Z.jsx)(n,{id:e,name:t.name,checked:t.value===!0,onChange:e=>t.onChange(e.target.checked),onBlur:t.onBlur,ref:t.ref}),required:o,label:s,sx:{mb:2}})})})},e):t.type===`array`?(0,Z.jsxs)(C,{fullWidth:!0,children:[(0,Z.jsxs)(f,{htmlFor:e,children:[s,o&&(0,Z.jsx)(`span`,{style:{color:`red`},children:` *`})]}),(0,Z.jsx)(ft,{name:e,control:r,rules:{required:o?`${s} is required`:!1,validate:e=>o&&(!Array.isArray(e)||e.length===0)?`${s} must have at least one value`:!0},render:({field:t})=>(0,Z.jsxs)(w,{children:[(0,Z.jsx)(vr,{value:Array.isArray(t.value)?t.value:[],onChange:t.onChange,fieldLabel:s}),i[e]&&(0,Z.jsx)(U,{variant:`caption`,color:`error`,sx:{mt:.5,ml:1.75},children:i[e]?.message})]})})]},e):null};function mi(e,t){switch(t.type){case`string`:if(typeof e!=`string`||t.enum&&t.enum.length>0&&!t.enum.includes(e))return!1;if(t.regex)try{return new RegExp(t.regex).test(e)}catch{return!0}return!0;case`number`:return typeof e==`number`&&Number.isFinite(e);case`boolean`:return typeof e==`boolean`;case`array`:return Array.isArray(e);case`object`:return typeof e==`object`&&!!e&&!Array.isArray(e);default:return!0}}function hi(e,t){if(!t)return e;let n={};return Object.entries(e).forEach(([e,r])=>{let i=t[e];i&&!i.required&&!mi(r,i)||(n[e]=r)}),n}var gi=e=>e==null?`-`:Array.isArray(e)?e.join(`, `):typeof e==`object`?JSON.stringify(e):typeof e==`string`||typeof e==`number`?String(e):`-`;function _i(e){let t=(0,Q.c)(11),{user:n}=e,{t:r}=K(),i;t[0]===r?i=t[1]:(i={handlers:{t:r}},t[0]=r,t[1]=i);let{resolveDisplayName:a}=et(i),{data:o}=pr(),s;t[2]!==n.type||t[3]!==o?.types?(s=o?.types?.find(e=>e.name===n.type),t[2]=n.type,t[3]=o?.types,t[4]=s):s=t[4];let{data:c,isLoading:l}=fr(s?.id),u;if(t[5]!==l||t[6]!==a||t[7]!==r||t[8]!==n.attributes||t[9]!==c?.schema){let e=n.attributes??{},i=e=>{let t=c?.schema?.[e];return t?.displayName&&a(t.displayName)||e};u=(0,Z.jsx)(nt,{title:r(`users:manageUser.sections.attributes.title`,`User Attributes`),description:r(`users:manageUser.sections.attributes.summaryDescription`,`A preview of this user's attribute values. Manage them from the Attributes tab.`),children:l?(0,Z.jsx)(w,{sx:{display:`flex`,justifyContent:`center`,py:4},children:(0,Z.jsx)(v,{size:32})}):Object.keys(e).length>0?(0,Z.jsx)(y,{spacing:2,children:Object.entries(e).map(e=>{let[t,n]=e;return(0,Z.jsxs)(w,{children:[(0,Z.jsx)(U,{variant:`caption`,color:`text.secondary`,children:i(t)}),typeof n==`boolean`?(0,Z.jsx)(w,{children:(0,Z.jsx)(ee,{label:n?r(`common:actions.yes`,`Yes`):r(`common:actions.no`,`No`),size:`small`,color:n?`success`:`default`,variant:`outlined`})}):(0,Z.jsx)(U,{variant:`body1`,children:gi(n)})]},t)})}):(0,Z.jsx)(U,{variant:`body2`,color:`text.secondary`,children:r(`users:manageUser.sections.attributes.empty`,`No attributes available`)})}),t[5]=l,t[6]=a,t[7]=r,t[8]=n.attributes,t[9]=c?.schema,t[10]=u}else u=t[10];return u}function vi(){let e=(0,Q.c)(9),{http:t}=D(),{getServerUrl:n}=P(),{t:r}=K(`users`),{showToast:i}=ae(),a;e[0]!==n||e[1]!==t?(a=async e=>{let{userId:r,data:i}=e,a=n();await t.request({url:`${a}/users/${r}/update-credentials`,method:`POST`,headers:{"Content-Type":`application/json`},data:i})},e[0]=n,e[1]=t,e[2]=a):a=e[2];let o;e[3]!==i||e[4]!==r?(o=()=>{i(r(`updateCredentials.success`),`success`)},e[3]=i,e[4]=r,e[5]=o):o=e[5];let s;return e[6]!==a||e[7]!==o?(s={mutationFn:a,onSuccess:o},e[6]=a,e[7]=o,e[8]=s):s=e[8],Xe(s)}function yi(e){let t=(0,Q.c)(20),{open:n,field:r,userId:i,onClose:a}=e,{t:o}=K(`users`),s=vi(),c;t[0]===Symbol.for(`react.memo_cache_sentinel`)?(c={newValue:``,confirmValue:``},t[0]=c):c=t[0];let[l,u]=(0,X.useState)(c),[d,p]=(0,X.useState)(!1),[m,h]=(0,X.useState)(!1),g;t[1]!==a||t[2]!==s?(g=()=>{u({newValue:``,confirmValue:``}),p(!1),s.reset(),a()},t[1]=a,t[2]=s,t[3]=g):g=t[3];let _=g,v;t[4]!==r||t[5]!==l||t[6]!==_||t[7]!==s||t[8]!==i?(v=()=>{if(!(!r||l.newValue.trim()===``)){if(l.newValue!==l.confirmValue){p(!0);return}h(!0),s.mutate({userId:i,data:{credentials:{[r.fieldName]:l.newValue}}},{onSuccess:()=>{h(!1),_()},onError:()=>{h(!1)}})}},t[4]=r,t[5]=l,t[6]=_,t[7]=s,t[8]=i,t[9]=v):v=t[9];let b=v,x;return t[10]!==r||t[11]!==l||t[12]!==_||t[13]!==b||t[14]!==m||t[15]!==d||t[16]!==n||t[17]!==o||t[18]!==s?(x=(0,Z.jsx)(We,{open:n,onClose:_,maxWidth:`sm`,fullWidth:!0,children:r&&(0,Z.jsxs)(Z.Fragment,{children:[(0,Z.jsx)(Je,{children:o(`manageUser.sections.credentials.resetTitle`,`Reset {{label}}?`,{label:r.label})}),(0,Z.jsxs)(Ke,{children:[(0,Z.jsx)(qe,{sx:{mb:2},children:o(`manageUser.sections.credentials.resetDialogMessage`,`A new {{label}} will be set for this user. The current {{label}} will be invalidated immediately.`,{label:r.label.toLowerCase()})}),(0,Z.jsx)(E,{severity:`warning`,sx:{mb:2},children:o(`manageUser.sections.credentials.resetDialogDisclaimer`,`This action cannot be undone. The current {{label}} will stop working as soon as you confirm.`,{label:r.label.toLowerCase()})}),(0,Z.jsxs)(y,{spacing:2,children:[(0,Z.jsxs)(C,{fullWidth:!0,children:[(0,Z.jsx)(f,{sx:{mb:.5},children:o(`manageUser.sections.credentials.newValue`,`New {{label}}`,{label:r.label})}),(0,Z.jsx)(br,{id:`credential-new-${r.fieldName}`,name:`new-${r.fieldName}`,value:l.newValue,placeholder:o(`manageUser.sections.credentials.newValuePlaceholder`,`Enter new {{label}}`,{label:r.label.toLowerCase()}),required:!0,error:!1,color:`primary`,onChange:e=>{u(t=>({...t,newValue:e.target.value})),p(!1),s.reset()},inputRef:null})]}),(0,Z.jsxs)(C,{fullWidth:!0,children:[(0,Z.jsx)(f,{sx:{mb:.5},children:o(`manageUser.sections.credentials.confirmValue`,`Confirm {{label}}`,{label:r.label})}),(0,Z.jsx)(br,{id:`credential-confirm-${r.fieldName}`,name:`confirm-${r.fieldName}`,value:l.confirmValue,placeholder:o(`manageUser.sections.credentials.confirmValuePlaceholder`,`Confirm new {{label}}`,{label:r.label.toLowerCase()}),required:!0,error:d,helperText:d?o(`manageUser.sections.credentials.mismatch`,`Values do not match.`):void 0,color:d?`error`:`primary`,onChange:e=>{u(t=>({...t,confirmValue:e.target.value})),p(!1),s.reset()},inputRef:null})]})]}),s.error&&(0,Z.jsx)(E,{severity:`error`,sx:{mt:2},children:Tr(s.error,o,`updateCredentials.error`,`Failed to update credentials. Please try again.`)})]}),(0,Z.jsxs)(Ge,{children:[(0,Z.jsx)(H,{onClick:_,disabled:m,children:o(`common:actions.cancel`,`Cancel`)}),(0,Z.jsx)(H,{variant:`contained`,color:`error`,onClick:b,disabled:m||l.newValue.trim()===``,children:m?o(`manageUser.sections.credentials.resetting`,`Resetting…`):o(`manageUser.sections.credentials.resetButton`,`Reset {{label}}`,{label:r.label})})]})]})}),t[10]=r,t[11]=l,t[12]=_,t[13]=b,t[14]=m,t[15]=d,t[16]=n,t[17]=o,t[18]=s,t[19]=x):x=t[19],x}function bi(e){let t=(0,Q.c)(8),{userId:n,credentialFields:r}=e,{t:i}=K(),[a,o]=(0,X.useState)(null),s;if(t[0]!==a||t[1]!==r||t[2]!==i||t[3]!==n){let e;t[5]===i?e=t[6]:(e=(e,t)=>(0,Z.jsxs)(w,{sx:{mt:t>0?5:0},children:[(0,Z.jsx)(U,{variant:`subtitle2`,sx:{mb:.5},children:e.label}),(0,Z.jsx)(U,{variant:`body2`,color:`text.secondary`,sx:{mb:1.5},children:i(`users:manageUser.sections.credentials.resetHint`,`Resetting will immediately invalidate the current {{label}}.`,{label:e.label.toLowerCase()})}),(0,Z.jsx)(H,{variant:`outlined`,color:`error`,onClick:()=>o(e),children:i(`users:manageUser.sections.credentials.resetButton`,`Reset {{label}}`,{label:e.label})})]},e.fieldName),t[5]=i,t[6]=e);let c;t[7]===Symbol.for(`react.memo_cache_sentinel`)?(c=()=>o(null),t[7]=c):c=t[7],s=(0,Z.jsxs)(Z.Fragment,{children:[(0,Z.jsx)(nt,{title:i(`users:manageUser.sections.credentials.resetCredentialsTitle`,`Reset Credentials`),description:i(`users:manageUser.sections.credentials.resetCredentialsDescription`,`Reset user credentials. These actions are irreversible.`),children:(0,Z.jsx)(y,{spacing:3,children:r.map(e)})}),(0,Z.jsx)(yi,{open:a!==null,field:a,userId:n,onClose:c})]}),t[0]=a,t[1]=r,t[2]=i,t[3]=n,t[4]=s}else s=t[4];return s}var xi=e=>Object.fromEntries(Object.entries(e).filter(([,e])=>e!==``&&e!=null));function Si(e){let t=(0,Q.c)(27),{user:n,editedUser:r,onFieldChange:i}=e,{t:a}=K(),o;t[0]===a?o=t[1]:(o={handlers:{t:a}},t[0]=a,t[1]=o);let{resolveDisplayName:s}=et(o),{data:c}=pr(),l;t[2]!==n||t[3]!==c?.types?(l=c?.types?.find(e=>e.name===n.type),t[2]=n,t[3]=c?.types,t[4]=l):l=t[4];let{data:u,isLoading:d}=fr(l?.id),f;t[5]!==r.attributes||t[6]!==n?(f=r.attributes??n.attributes??{},t[5]=r.attributes,t[6]=n,t[7]=f):f=t[7];let p;t[8]===f?p=t[9]:(p={defaultValues:f,mode:`onChange`},t[8]=f,t[9]=p);let{control:m,formState:h}=ct(p),{errors:g}=h,_;t[10]===m?_=t[11]:(_={control:m},t[10]=m,t[11]=_);let y=ut(_),b=(0,X.useRef)(i),x,S;t[12]===i?(x=t[13],S=t[14]):(x=()=>{b.current=i},S=[i],t[12]=i,t[13]=x,t[14]=S),(0,X.useEffect)(x,S);let C,T;if(t[15]===y?(C=t[16],T=t[17]):(T=()=>{b.current(`attributes`,xi(y))},C=[y],t[15]=y,t[16]=C,t[17]=T),(0,X.useEffect)(T,C),d){let e;return t[18]===Symbol.for(`react.memo_cache_sentinel`)?(e=(0,Z.jsx)(w,{sx:{display:`flex`,justifyContent:`center`,py:4},children:(0,Z.jsx)(v,{size:32})}),t[18]=e):e=t[18],e}if(n.isReadOnly){let e;return t[19]===n?e=t[20]:(e=(0,Z.jsx)(_i,{user:n}),t[19]=n,t[20]=e),e}let E;if(t[21]!==m||t[22]!==g||t[23]!==s||t[24]!==a||t[25]!==u){let e=u?.schema?Object.entries(u.schema).filter(Ci):[];E=(0,Z.jsx)(nt,{title:a(`users:manageUser.sections.attributes.title`,`Attributes`),description:a(`users:manageUser.sections.attributes.description`,`manage user attribute values.`),children:(0,Z.jsx)(w,{sx:{display:`flex`,flexDirection:`column`,gap:2},children:e.length>0?e.map(e=>{let[t,n]=e;return pi(t,n,m,g,s)}):(0,Z.jsx)(U,{variant:`body2`,color:`text.secondary`,children:a(`users:manageUser.sections.attributes.noSchema`,`No schema available for editing`)})})}),t[21]=m,t[22]=g,t[23]=s,t[24]=a,t[25]=u,t[26]=E}else E=t[26];return E}function Ci(e){let[,t]=e;return!((t.type===`string`||t.type===`number`)&&t.credential)}function wi({children:e=null,value:t,index:n,...r}){return(0,Z.jsx)(`div`,{role:`tabpanel`,hidden:t!==n,id:`user-tabpanel-${n}`,"aria-labelledby":`user-tab-${n}`,...r,children:t===n&&(0,Z.jsx)(w,{sx:{py:3},children:e})})}function Ti(){let e=it(),{t}=K(),n=ge(`UserEditPage`),{resolveDisplayName:r}=et({handlers:{t}}),{userId:i}=at(),s=Ar(),[l,u]=(0,X.useState)(0),[d,p]=(0,X.useState)({}),[m,h]=(0,X.useState)(0),[g,_]=(0,X.useState)(!1),[v,b]=(0,X.useState)(null),x=(0,X.useRef)(null),{data:S,isLoading:w,error:T,refetch:D}=lr(i),O=mr(),{data:k,isLoading:M,error:N,refetch:P}=pr(),F=k?.types?.find(e=>e.name===S?.type),I=F?.id,L=F?.ouId?.trim(),R=L===``?void 0:L,{data:z,isLoading:te,error:B,refetch:ne}=fr(I),V=(0,X.useMemo)(()=>z?.schema?Object.entries(z.schema).filter(([,e])=>(e.type===`string`||e.type===`number`)&&e.credential).map(([e,t])=>{let n=e;if(t.displayName){let e=r(t.displayName);e&&(n=e)}return{fieldName:e,label:n}}):[],[z,r]),ie=S?.display??S?.id??``;(0,X.useEffect)(()=>()=>{x.current&&clearTimeout(x.current)},[]);let ae=(0,X.useCallback)(async(e,t)=>{await navigator.clipboard.writeText(e),b(t),x.current&&clearTimeout(x.current),x.current=setTimeout(()=>{b(null)},2e3)},[]),oe=(e,t)=>{u(t)},{isError:ce,reset:le}=O,ue=(0,X.useCallback)((e,t)=>{ce&&le(),p(n=>({...n,[e]:t}))},[ce,le]),de=(0,X.useCallback)(async()=>{let e=R??S?.ouId;if(!i||!e||!S?.type)return;let t=hi(d.attributes??S.attributes??{},z?.schema);try{await O.mutateAsync({userId:i,data:{ouId:e,type:S.type,attributes:t}}),p({}),await D(),h(e=>e+1)}catch(e){n.error(`Failed to update user`,{error:e})}},[R,S,i,d,z,O,D,n]),G=(0,X.useMemo)(()=>Object.entries(d).some(([e,t])=>!pe(t,S?.[e])),[d,S]),fe=async()=>{await e(s.list())},me=()=>{(async()=>{await e(s.list())})().catch(e=>{n.error(`Failed to navigate after deleting user`,{error:e})})};if(w||M||te)return(0,Z.jsx)(Ce,{});if(T??N??B)return(0,Z.jsx)(A,{children:(0,Z.jsx)(tt,{error:T??N??B,t:(e,n)=>t(e.includes(`:`)?e:`users:${e}`,n),resolveErrorMessage:Tr,variant:`block`,title:t(`users:manageUser.loadError`,`Failed to load user information`),onRetry:()=>{T&&D(),N&&P(),B&&ne()},action:(0,Z.jsx)(H,{onClick:()=>{fe().catch(()=>null)},startIcon:(0,Z.jsx)(Ve,{size:16}),children:t(`users:manageUser.back`,`Back to Users`)})})});if(!S)return(0,Z.jsxs)(A,{children:[(0,Z.jsx)(E,{severity:`warning`,sx:{mb:2},children:t(`users:manageUser.notFound`,`User not found`)}),(0,Z.jsx)(H,{onClick:()=>{fe().catch(()=>null)},startIcon:(0,Z.jsx)(Ve,{size:16}),children:t(`users:manageUser.back`)})]});let he=S.attributes?.picture,_e=[{key:`general`,label:t(`users:manageUser.tabs.general`,`General`),render:()=>(0,Z.jsxs)(y,{spacing:3,children:[(0,Z.jsx)(Mr,{user:S,copiedField:v,onCopyToClipboard:ae}),(0,Z.jsx)(_i,{user:S}),(0,Z.jsx)(nt,{title:t(`users:manageUser.sections.organizationUnit.title`,`Organization Unit`),description:t(`users:manageUser.sections.organizationUnit.description`,`The organization unit this user belongs to.`),children:(0,Z.jsxs)(y,{spacing:2,children:[(0,Z.jsxs)(C,{fullWidth:!0,children:[(0,Z.jsx)(f,{htmlFor:`ou-handle-input`,children:t(`users:manageUser.sections.organizationUnit.handleLabel`,`Handle`)}),(0,Z.jsx)(j,{id:`ou-handle-input`,value:S.ouHandle??`-`,fullWidth:!0,size:`small`,slotProps:{input:{readOnly:!0,endAdornment:S.ouHandle?(0,Z.jsx)(c,{position:`end`,children:(0,Z.jsx)(o,{title:v===`ouHandle`?t(`common:actions.copied`):t(`users:manageUser.sections.organizationUnit.copyHandle`,`Copy Organization Unit Handle`),children:(0,Z.jsx)(W,{"aria-label":t(`users:manageUser.sections.organizationUnit.copyHandle`,`Copy Organization Unit Handle`),onClick:()=>{ae(S.ouHandle,`ouHandle`).catch(()=>null)},edge:`end`,children:v===`ouHandle`?(0,Z.jsx)(Fe,{size:16}):(0,Z.jsx)(ze,{size:16})})})}):void 0}},sx:{"& input":{fontFamily:`monospace`,fontSize:`0.875rem`}}})]}),(0,Z.jsxs)(C,{fullWidth:!0,children:[(0,Z.jsx)(f,{htmlFor:`ou-id-input`,children:t(`users:manageUser.sections.organizationUnit.idLabel`,`ID`)}),(0,Z.jsx)(j,{id:`ou-id-input`,value:S.ouId,fullWidth:!0,size:`small`,slotProps:{input:{readOnly:!0,endAdornment:(0,Z.jsx)(c,{position:`end`,children:(0,Z.jsx)(o,{title:v===`ouId`?t(`common:actions.copied`):t(`users:manageUser.sections.organizationUnit.copyId`,`Copy Organization Unit ID`),children:(0,Z.jsx)(W,{"aria-label":t(`users:manageUser.sections.organizationUnit.copyId`,`Copy Organization Unit ID`),onClick:()=>{ae(S.ouId,`ouId`).catch(()=>null)},edge:`end`,children:v===`ouId`?(0,Z.jsx)(Fe,{size:16}):(0,Z.jsx)(ze,{size:16})})})})}},sx:{"& input":{fontFamily:`monospace`,fontSize:`0.875rem`}}})]})]})})]})},{key:`attributes`,label:t(`users:manageUser.tabs.attributes`,`Attributes`),render:()=>(0,Z.jsx)(Si,{user:S,editedUser:d,onFieldChange:ue},m)}];!S.isReadOnly&&V.length>0&&_e.push({key:`credentials`,label:t(`users:manageUser.tabs.credentials`,`Credentials`),render:()=>(0,Z.jsx)(bi,{userId:i,credentialFields:V})}),S.isReadOnly||_e.push({key:`advanced`,label:t(`users:manageUser.tabs.advanced`,`Advanced`),render:()=>(0,Z.jsx)(y,{spacing:3,children:(0,Z.jsxs)(nt,{title:t(`users:manageUser.sections.dangerZone.title`,`Danger Zone`),description:t(`users:manageUser.sections.dangerZone.description`,`Irreversible and destructive actions.`),children:[(0,Z.jsx)(U,{variant:`h6`,gutterBottom:!0,color:`error`,children:t(`users:manageUser.sections.dangerZone.deleteUser`,`Delete User`)}),(0,Z.jsx)(U,{variant:`body2`,color:`text.secondary`,sx:{mb:3},children:t(`users:manageUser.sections.dangerZone.deleteUserDescription`,`Once deleted, this user cannot be recovered. All associated data will be permanently removed.`)}),(0,Z.jsx)(H,{variant:`contained`,color:`error`,onClick:()=>_(!0),children:t(`common:actions.delete`,`Delete`)})]})})});let ve=l>=_e.length?0:l;return(0,Z.jsxs)(A,{children:[S.isReadOnly&&(0,Z.jsx)(E,{severity:`info`,sx:{mb:2},children:t(`common:messages.readOnlyResource`,`This resource is read-only and cannot be modified.`)}),(0,Z.jsxs)(se,{children:[(0,Z.jsx)(se.BackButton,{component:(0,Z.jsx)(ot,{to:s.list()}),children:t(`users:manageUser.back`,`Back to Users`)}),(0,Z.jsx)(se.Avatar,{children:(0,Z.jsx)(Ye,{value:he,fallback:`${Or.DEFAULT_AVATAR_PREFIX}${ke(ie)}`,size:55})}),(0,Z.jsx)(se.Header,{children:(0,Z.jsx)(U,{variant:`h3`,children:ie})}),(0,Z.jsx)(se.SubHeader,{children:(0,Z.jsx)(y,{direction:`row`,alignItems:`center`,spacing:1,children:(0,Z.jsx)(ee,{label:S.type,size:`small`,sx:{px:.5}})})})]}),(0,Z.jsx)(re,{value:ve,onChange:oe,"aria-label":`user settings tabs`,children:_e.map((e,t)=>(0,Z.jsx)(a,{label:e.label,id:`user-tab-${t}`,"aria-controls":`user-tabpanel-${t}`,sx:{textTransform:`none`}},e.key))}),_e.map((e,t)=>(0,Z.jsx)(wi,{value:ve,index:t,children:e.render()},e.key)),(0,Z.jsx)(Dr,{open:g,userId:i??null,onClose:()=>_(!1),onSuccess:me}),G&&(0,Z.jsx)(rt,{message:t(`users:manageUser.unsavedChanges`,`You have unsaved changes`),resetLabel:t(`users:manageUser.reset`,`Reset`),saveLabel:t(`users:manageUser.save`,`Save`),savingLabel:t(`users:manageUser.saving`,`Saving…`),isSaving:O.isPending,saveDisabled:S.isReadOnly===!0,error:O.error?Tr(O.error,(e,n)=>t(e.includes(`:`)?e:`users:${e}`,n),`update.error`,`Failed to update user. Please try again.`):void 0,onReset:()=>{O.reset(),p({}),h(e=>e+1)},onSave:()=>{de()}})]})}function Ei(){let e=(0,Q.c)(9),t=it(),{t:n}=K(),r=ge(`UsersListPage`),i=Ar(),a;if(e[0]!==r||e[1]!==t||e[2]!==i||e[3]!==n){let o;e[5]!==r||e[6]!==t||e[7]!==i?(o=()=>{(async()=>{await t(i.add())})().catch(e=>{r.error(`Failed to navigate to add user page`,{error:e})})},e[5]=r,e[6]=t,e[7]=i,e[8]=o):o=e[8],a=(0,Z.jsxs)(A,{children:[(0,Z.jsxs)(se,{children:[(0,Z.jsx)(se.Header,{children:n(`users:title`)}),(0,Z.jsxs)(se.SubHeader,{children:[n(`users:subtitle`),` `,(0,Z.jsx)(Ze,{docKey:`users`})]}),(0,Z.jsx)(se.Actions,{children:(0,Z.jsx)(H,{variant:`contained`,startIcon:(0,Z.jsx)(Re,{size:20}),onClick:o,children:n(`users:addUser`)})})]}),(0,Z.jsx)(jr,{})]}),e[0]=r,e[1]=t,e[2]=i,e[3]=n,e[4]=a}else a=e[4];return a}export{sr as C,pt as D,ht as E,lr as S,jt as T,mr as _,pi as a,dr as b,Mr as c,Ar as d,Or as f,vr as g,br as h,hi as i,jr as l,Tr as m,Ti as n,di as o,Dr as p,mi as r,ni as s,Ei as t,kr as u,pr as v,er as w,ur as x,fr as y};