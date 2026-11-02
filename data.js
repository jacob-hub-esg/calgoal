// Rung by Rung — exercise data.
// Each step is [name, target, form cue]. "start" is the default level (0-based step index).

// Your plan: these exercises appear on your training days.
const EX = {
  "scap-pull": { name: "Scapular pull-ups", focus: "Shoulder blades · grip", start: 2, steps: [
    ["Dead hang", "3 × 30–60s", "Hang relaxed. Builds grip and shoulder tolerance."],
    ["Active hang", "3 × 20–30s", "Arms straight, pull your shoulders away from your ears and hold."],
    ["Scapular pull-up", "3 × 10", "From a dead hang, pull the shoulder blades down and back to lift a few centimetres. Elbows never bend."],
    ["Paused scapular pull-up", "3 × 8, 2s hold", "Same movement, hold the top for two seconds and lower slowly."],
    ["Arch hang", "3 × 10s", "Squeeze shoulder blades down and together until your chest lifts toward the bar."],
    ["One-arm scapular pull-up", "3 × 5 per arm", "One hand on the bar. Keep hips square and avoid twisting."]
  ], related: ["pull-ups", "chin-ups", "rows"], alts: ["Band pull-aparts", "Ring face pulls"] },

  "pull-ups": { name: "Pull-ups", focus: "Lats · upper back", start: 2, steps: [
    ["Pull-up negatives", "3 × 3–5, 5s down", "Jump or step to the top, then lower as slowly as you can."],
    ["Band-assisted pull-up", "3 × 8", "Use the lightest band that still lets you finish every rep."],
    ["Pull-up", "3 × 5 → 3 × 10", "Overhand grip. Full hang to chin over the bar, no kipping."],
    ["Chest-to-bar pull-up", "3 × 5", "Pull higher and lead with the chest. Drive the elbows down and back."],
    ["L-sit pull-up", "3 × 5", "Hold your legs at 90°. Removes swing and adds core work."],
    ["Archer pull-up", "3 × 4 per side", "Wide grip. One arm pulls while the other stays almost straight."],
    ["One-arm pull-up", "1–3 per arm", "Build up with one-arm negatives and light band assistance."]
  ], related: ["scap-pull", "chin-ups", "rows", "hanging-leg-raise"], alts: ["Typewriter pull-up", "Muscle-up"] },

  "rows": { name: "Bodyweight rows", focus: "Mid back · rear delts", start: 1, steps: [
    ["Incline row", "3 × 12", "Bar at chest height, body at about 45°. Pull the chest to the bar."],
    ["Horizontal row", "3 × 10", "Bar at hip height, body straight like a plank, heels on the floor."],
    ["Feet-elevated row", "3 × 10", "Feet on a box so the body is parallel to the floor."],
    ["Archer row", "3 × 6 per side", "Shift your weight to one arm. The other arm stays straight and only guides."],
    ["Tuck front lever row", "3 × 5", "Hold a tuck front lever and row the bar to your hips."],
    ["One-arm row", "3 × 5 per arm", "Feet wide. Resist rotating toward the free arm."]
  ], related: ["pull-ups", "chin-ups", "scap-pull"], alts: ["Ring rows", "Front lever progression"] },

  "chin-ups": { name: "Chin-ups", focus: "Lats · biceps", start: 2, steps: [
    ["Chin-up negatives", "3 × 3–5, 5s down", "Start at the top with palms facing you and lower slowly."],
    ["Band-assisted chin-up", "3 × 8", "Lightest band that lets you finish all sets."],
    ["Chin-up", "3 × 5 → 3 × 10", "Palms toward you, shoulder-width. Full hang to chin over the bar."],
    ["Chest-to-bar chin-up", "3 × 5", "Pull until the lower chest touches the bar."],
    ["Archer chin-up", "3 × 4 per side", "One arm does most of the work while the other straightens."],
    ["One-arm chin-up negatives", "3 × 3 per arm, 5s down", "The bridge to a full one-arm chin-up."]
  ], related: ["pull-ups", "rows", "scap-pull"], alts: ["Close-grip chin-up", "Commando pull-up"] },

  "plank": { name: "Plank", focus: "Core · anti-extension", start: 1, steps: [
    ["Knee plank", "3 × 30s", "Forearms and knees down, straight line from knees to head."],
    ["Forearm plank", "3 × 45–60s", "Ribs down, glutes tight, body in one straight line."],
    ["RKC plank", "3 × 15–20s", "Pull elbows toward toes and squeeze everything. Short and hard."],
    ["Long-lever plank", "3 × 20–30s", "Place elbows a hand-length in front of the shoulders."],
    ["Body saw", "3 × 8", "From a forearm plank, rock the body forward and back without the hips sagging."],
    ["Ab wheel from knees", "3 × 8", "Roll out only as far as you can keep your back flat."],
    ["Standing ab wheel", "3 × 3–5", "Full rollout from standing. Start with partial range to a wall."]
  ], related: ["hollow", "hanging-leg-raise", "l-sit"], alts: ["Side plank"] },

  "back-bridge": { name: "Back bridge", focus: "Spine extension · shoulder mobility", start: 3, steps: [
    ["Glute bridge", "3 × 12", "On your back, drive the hips up and squeeze the glutes."],
    ["Reverse tabletop", "3 × 20s", "Hands behind you, hips up level with the shoulders, chest open."],
    ["Elevated bridge", "3 × 20s", "Hands on a bench or step, push up into the arch."],
    ["Full back bridge", "3 × 15–20s", "Hands by your ears, push through straight arms and lift the chest."],
    ["Straight-leg bridge", "3 × 20s", "Shift shoulders over the hands and slowly straighten the legs."],
    ["Wall walk-down", "3 × 3", "Lean back and walk your hands down a wall into a bridge, then walk back up."],
    ["Stand-to-bridge", "3 × 3", "Drop back to the floor with control and stand back up."]
  ], related: ["hollow", "plank", "pike-pu"], alts: ["German hang", "Cobra stretch"] },

  "hanging-leg-raise": { name: "Hanging leg raises", focus: "Lower abs · hip flexors · grip", start: 2, steps: [
    ["Hanging knee raise", "3 × 10", "Lift the knees to hip height without swinging."],
    ["Hanging tuck raise", "3 × 10", "Knees to chest and curl the pelvis up at the top."],
    ["Hanging leg raise to 90°", "3 × 8", "Straight legs to hip height. Lower in two seconds."],
    ["Toes-to-bar", "3 × 6", "Bring the legs all the way up to touch the bar."],
    ["Strict toes-to-bar", "3 × 5", "No kip. Lower over three seconds."],
    ["Windshield wipers", "3 × 4 per side", "From the toes-to-bar position, rotate the legs side to side."]
  ], related: ["l-sit", "pike-lifts", "hollow"], alts: ["Dragon flag", "Hanging L-sit"] },

  "scap-push": { name: "Scapular push-ups", focus: "Serratus · shoulder blades", start: 1, steps: [
    ["Incline scapular push-up", "3 × 12", "Hands on a bench. Arms stay straight the whole time."],
    ["Scapular push-up", "3 × 12", "Let the shoulder blades sink together, then push the floor away to round the upper back."],
    ["Paused scapular push-up", "3 × 10, 2s hold", "Hold the fully pushed position for two seconds."],
    ["Pseudo-planche scap push-up", "3 × 10", "Lean so the shoulders are ahead of the hands."],
    ["Tuck planche scap push-up", "3 × 5", "In a tuck planche, sink and push the shoulder blades."]
  ], related: ["push-ups", "frog-stance", "scap-pull"], alts: ["Planche lean"] },

  "push-ups": { name: "Push-ups", focus: "Chest · triceps · front delts", start: 2, steps: [
    ["Incline push-up", "3 × 12", "Hands on a bench or table, body straight."],
    ["Knee push-up", "3 × 12", "Straight line from knees to head, chest to the floor."],
    ["Push-up", "3 × 10 → 3 × 20", "Body straight, chest to the floor, elbows at about 45°."],
    ["Diamond push-up", "3 × 10", "Hands together under the chest. Shifts work to the triceps."],
    ["Pseudo-planche push-up", "3 × 8", "Hands by the hips, fingers turned out, lean forward."],
    ["Archer push-up", "3 × 6 per side", "Wide hands. One arm bends while the other stays straight."],
    ["One-arm push-up", "3 × 3 per arm", "Feet wide. Start on an incline and lower it over time."]
  ], related: ["scap-push", "dips", "pike-pu", "tricep-ext"], alts: ["Decline push-up", "Ring push-up"] },

  "dips": { name: "Dips", focus: "Chest · triceps", start: 3, steps: [
    ["Bench dip", "3 × 12", "Hands on a bench behind you, feet on the floor."],
    ["Support hold", "3 × 20–30s", "Hold the top of the dip, shoulders pushed down."],
    ["Dip negatives", "3 × 5, 5s down", "Start at the top and lower slowly."],
    ["Parallel bar dip", "3 × 8 → 3 × 12", "Lower until the upper arms are parallel to the floor, lean slightly forward."],
    ["Straight bar dip", "3 × 6", "Single bar in front of you. Lean over it as you lower."],
    ["Ring dip", "3 × 5", "Keep the rings close to the body and turn them out at the top."],
    ["Weighted dip", "3 × 6", "Add a backpack or dip belt."]
  ], related: ["push-ups", "tricep-ext", "scap-push"], alts: ["Korean dip", "Muscle-up"] },

  "pike-pu": { name: "Pike push-ups", focus: "Shoulders · overhead strength", start: 0, steps: [
    ["Pike push-up", "3 × 8 → 3 × 12", "Hips high. Lower the head to a point in front of the hands."],
    ["Elevated pike push-up", "3 × 8", "Feet on a box so the torso is more vertical."],
    ["Deficit pike push-up", "3 × 6", "Hands on blocks so the head drops below hand level."],
    ["Wall handstand hold", "3 × 30s", "Chest facing the wall, body straight, push tall."],
    ["Wall handstand push-up negatives", "3 × 3, 5s down", "Lower slowly to the head, then come down."],
    ["Wall handstand push-up", "3 × 5", "Full range against the wall."],
    ["Freestanding handstand push-up", "1–3", "Requires a solid freestanding handstand first."]
  ], related: ["push-ups", "frog-stance", "hollow"], alts: ["Handstand practice"] },

  "tricep-ext": { name: "Tricep extensions", focus: "Triceps", start: 2, steps: [
    ["Wall extension", "3 × 12", "Forearms on the wall, push back to straight arms."],
    ["High-bar extension", "3 × 10", "Bar at chest height. Bend only at the elbows, head goes under the bar."],
    ["Hip-height extension", "3 × 10", "Lower bar, so more of your bodyweight is on the arms."],
    ["Low-bar extension", "3 × 8", "Bar around knee height. Keep the body rigid."],
    ["Ring extension", "3 × 8", "Rings add instability. Keep elbows narrow."],
    ["Tiger bend push-up", "3 × 3", "From a push-up, lower onto the forearms and press back up."]
  ], related: ["dips", "push-ups"], alts: ["Diamond push-up"] },

  "frog-stance": { name: "Frog stance", focus: "Balance · wrists · planche prep", start: 2, steps: [
    ["Tripod tuck", "3 × 20s", "Head and hands on the floor in a triangle, knees resting on the elbows."],
    ["Frog stance, toes down", "3 × 10s", "Knees on the elbows, lift one foot at a time."],
    ["Frog stance", "3 × 10–20s", "Lean forward until both feet float. Look slightly ahead."],
    ["Frog stance, 30 seconds", "3 × 30s", "Same hold, longer and steadier."],
    ["Crane (straight arms)", "3 × 10s", "Knees high on the upper arms with the elbows locked."],
    ["Tuck planche", "3 × 5–10s", "Knees off the arms, straight arms, hips level with the shoulders."]
  ], related: ["scap-push", "pike-pu", "push-ups"], alts: ["Planche lean", "Wrist warm-up"] },

  "hollow": { name: "Hollow body holds", focus: "Core · body tension", start: 4, steps: [
    ["Dead bug", "3 × 10 per side", "Lower back pressed into the floor while opposite arm and leg extend."],
    ["Tuck hollow hold", "3 × 20s", "Knees bent over the hips, shoulders lifted, lower back flat."],
    ["One-leg hollow hold", "3 × 20s per side", "One leg straight and low, the other tucked."],
    ["Hollow hold, arms by sides", "3 × 20s", "Both legs straight and low, arms reaching toward the feet."],
    ["Full hollow body hold", "3 × 30s", "Arms by the ears, legs straight, lower back stays on the floor."],
    ["Hollow rocks", "3 × 15", "Keep the full hollow shape and rock from shoulders to hips."],
    ["Hollow hold, 60 seconds", "3 × 60s", "Same full position for a full minute."]
  ], related: ["plank", "l-sit", "hanging-leg-raise", "back-bridge"], alts: ["Dragon flag", "Arch body hold"] },

  "jump-squats": { name: "Jumping squats", focus: "Power · quads", start: 2, steps: [
    ["Air squat", "3 × 20", "Full depth, heels down, chest up."],
    ["Squat jump, stick the landing", "3 × 8", "Land softly and pause before each rep."],
    ["Continuous jump squats", "3 × 12", "Land soft and go straight into the next jump."],
    ["Tuck jumps", "3 × 8", "Drive the knees to the chest at the top."],
    ["Split-squat jumps", "3 × 8 per side", "Switch legs in the air, land in a lunge."],
    ["Box jump", "3 × 5", "Jump onto a box, step down."],
    ["Single-leg jump", "3 × 5 per side", "Jump and land on one leg."]
  ], related: ["bss", "calf-raises", "sissy"], alts: ["Broad jump"] },

  "bss": { name: "Bulgarian split squats", focus: "Quads · glutes · balance", start: 1, steps: [
    ["Static split squat", "3 × 10 per side", "Both feet on the floor, back knee lowers toward the ground."],
    ["Bulgarian split squat", "3 × 10 per side", "Rear foot on a bench, front knee travels over the toes."],
    ["Deficit Bulgarian", "3 × 8 per side", "Front foot on a plate or step for more depth."],
    ["Loaded Bulgarian", "3 × 8 per side", "Add a backpack or hold weights."],
    ["Assisted shrimp squat", "3 × 6 per side", "Hold a support, lower the rear knee to the floor."],
    ["Shrimp squat", "3 × 5 per side", "Hold the rear foot, touch the knee down without support."]
  ], related: ["sissy", "horse-stance", "jump-squats", "calf-raises"], alts: ["Pistol squat", "Step-up"] },

  "calf-raises": { name: "Calf raises", focus: "Calves · ankles", start: 1, steps: [
    ["Floor calf raise", "3 × 20", "Both feet, rise as high as you can."],
    ["Calf raise on a step", "3 × 15", "Heels drop below the step for a full stretch."],
    ["Single-leg on a step", "3 × 12 per side", "Hold a wall lightly for balance only."],
    ["Slow single-leg", "3 × 8 per side", "Two-second pause at the top, three seconds down."],
    ["Loaded single-leg", "3 × 10 per side", "Add a backpack."],
    ["Single-leg pogo hops", "3 × 20 per side", "Quick, springy hops on the ball of the foot."]
  ], related: ["jump-squats", "bss"], alts: ["Tibialis raise"] },

  "sissy": { name: "Sissy squats", focus: "Quads · knee strength", start: 1, steps: [
    ["Assisted, partial range", "3 × 10", "Hold a post, rise onto the toes, knees forward, half range."],
    ["Assisted, full range", "3 × 10", "Knees travel forward until the thighs are near horizontal."],
    ["Assisted, slow lowering", "3 × 6, 4s down", "Control the way down, use the hand to help up."],
    ["Freestanding, partial", "3 × 8", "No support. Arms forward for balance."],
    ["Freestanding, full range", "3 × 8", "Full depth with no support."],
    ["Weighted sissy squat", "3 × 6", "Hold a plate or backpack to the chest."]
  ], related: ["bss", "horse-stance", "jump-squats"], alts: ["Reverse Nordic", "Wall sit"] },

  "l-sit": { name: "L-sit", focus: "Compression · core · triceps", start: 1, steps: [
    ["Foot-supported L-sit", "3 × 15s", "Heels on the floor, hips lifted, arms locked."],
    ["Tuck L-sit", "3 × 15s", "Knees pulled to the chest, feet off the floor."],
    ["One-leg L-sit", "3 × 10s per side", "One leg straight, the other tucked."],
    ["Full L-sit", "3 × 10s", "Both legs straight and level with the hips."],
    ["Full L-sit, 30 seconds", "3 × 30s", "Push the shoulders down and point the toes."],
    ["V-sit progression", "3 × 5s", "Legs rise above horizontal."]
  ], related: ["pike-lifts", "hanging-leg-raise", "hollow"], alts: ["Hanging L-sit"] },

  "pike-lifts": { name: "Seated pike lifts", focus: "Hip flexors · compression", start: 2, steps: [
    ["Seated knee tuck lifts", "3 × 10", "Lean back slightly, lift bent knees off the floor."],
    ["Single-leg pike lift", "3 × 10 per side", "One straight leg at a time."],
    ["Pike lift, hands by hips", "3 × 10", "Both legs straight, lift the heels off the floor."],
    ["Pike lift, hands by knees", "3 × 10", "Hands further forward make it harder."],
    ["Pike lift, hands by ankles", "3 × 8", "Maximum compression. Lean forward over the legs."],
    ["Lift and hold", "3 × 5, 5s hold", "Hold the legs up at the top of each rep."]
  ], related: ["l-sit", "hanging-leg-raise"], alts: ["Pancake stretch"] },

  "horse-stance": { name: "Horse stance", focus: "Quads · adductors · leg endurance", start: 1, steps: [
    ["High horse stance", "3 × 30s", "Feet about twice shoulder-width, toes forward. Sit halfway down to parallel."],
    ["Horse stance", "3 × 30–45s", "Sink until the thighs are close to parallel. Knees push out over the toes, back upright."],
    ["Horse stance, 60 seconds", "3 × 60s", "Same depth for a full minute. Breathe slowly and keep the chest up."],
    ["Low horse stance", "3 × 45s", "Thighs parallel to the floor, weight spread through the whole foot."],
    ["Horse stance, 2 minutes", "2 × 2 min", "Parallel depth for two minutes without rising."],
    ["Loaded horse stance", "3 × 60s", "Hold a backpack or weight at the chest."]
  ], related: ["bss", "sissy", "jump-squats", "calf-raises"], alts: ["Wall sit", "Cossack squat"] }
};

const DAYS = {
  push: { label: "Push", list: ["scap-push", "push-ups", "dips", "pike-pu", "tricep-ext", "frog-stance", "back-bridge", "hollow"] },
  pull: { label: "Pull", list: ["scap-pull", "pull-ups", "rows", "chin-ups", "plank", "back-bridge", "hanging-leg-raise"] },
  legs: { label: "Legs", list: ["jump-squats", "bss", "calf-raises", "sissy", "horse-stance", "l-sit", "pike-lifts", "hanging-leg-raise"] }
};

// Ready-made ladders you can add from the "Add an exercise" screen.
const CATALOG = {
  // Push and balance
  "k-handstand": { name: "Handstand", focus: "Shoulders · balance", start: 2, steps: [
    ["Pike hold on a box", "3 × 30s", "Feet on a box, hips over the hands, arms locked by the ears."],
    ["Wall walk", "3 × 3", "From a plank with feet at the wall, walk the feet up and the hands in."],
    ["Chest-to-wall handstand", "3 × 30s", "Chest facing the wall, body straight, push the floor away."],
    ["Chest-to-wall handstand, 60 seconds", "3 × 60s", "Same hold for a full minute."],
    ["Kick-up to handstand", "5 × 10s", "Kick up away from the wall and find the balance point."],
    ["Freestanding handstand", "5 × 20s", "Balance with the fingers. Stack hips over shoulders."],
    ["Handstand walk", "5 × 5 steps", "Lean slightly forward and take small steps with the hands."]
  ], related: ["pike-pu", "frog-stance", "hollow"], alts: ["Wall handstand shoulder taps"] },

  "k-planche": { name: "Planche", focus: "Straight-arm pushing · shoulders", start: 0, steps: [
    ["Planche lean", "3 × 20s", "From a push-up position, lean the shoulders well past the hands. Arms locked."],
    ["Tuck planche", "3 × 10s", "Knees tucked, hips level with the shoulders, arms straight."],
    ["Advanced tuck planche", "3 × 8s", "Flat back with the hips opened out."],
    ["Straddle planche", "3 × 5s", "Legs wide and straight, body parallel to the floor."],
    ["Full planche", "3 × 3s", "Legs together, body straight and parallel to the floor."]
  ], related: ["frog-stance", "scap-push", "push-ups"], alts: ["Pseudo-planche push-up"] },

  "k-elbow-lever": { name: "Elbow lever", focus: "Balance · core · wrists", start: 0, steps: [
    ["Elbow lever lean, feet down", "3 × 20s", "Elbows into the hips, lean forward with toes on the floor."],
    ["Tuck elbow lever", "3 × 15s", "Lift the feet with knees bent."],
    ["Elbow lever", "3 × 10s", "Legs straight and body horizontal."],
    ["One-arm elbow lever", "3 × 5s per arm", "Balance on one elbow, free arm out to the side."]
  ], related: ["frog-stance", "hollow"], alts: ["Crow pose"] },

  "k-ring-flye": { name: "Ring flyes", focus: "Chest · shoulder stability", start: 1, steps: [
    ["Incline ring push-up", "3 × 12", "Rings at hip height. Turn the rings out at the top."],
    ["Ring push-up", "3 × 10", "Rings a few centimetres off the floor, body straight."],
    ["High ring flye", "3 × 10", "Rings high, arms slightly bent, open the arms wide and squeeze back."],
    ["Ring flye", "3 × 8", "Rings lower so more weight goes through the arms."],
    ["Low ring flye", "3 × 6", "Rings close to the floor. Only go as wide as you control."]
  ], related: ["push-ups", "dips"], alts: ["Ring dips"] },

  "k-explosive-push": { name: "Explosive push-ups", focus: "Chest · power", start: 1, steps: [
    ["Fast push-up", "3 × 8", "Lower with control, push up as fast as you can."],
    ["Incline clap push-up", "3 × 6", "Hands on a bench. Push off, clap, land softly."],
    ["Clap push-up", "3 × 6", "From the floor. Land with soft elbows."],
    ["Chest-clap push-up", "3 × 5", "Clap against your chest in the air."],
    ["Double clap push-up", "3 × 3", "Two claps before landing."]
  ], related: ["push-ups", "dips"], alts: ["Superman push-up"] },

  // Pull and levers
  "k-muscle-up": { name: "Muscle-up", focus: "Explosive pull · dip transition", start: 0, steps: [
    ["High pull-up", "3 × 5", "Pull as high as you can, aiming the bar at your lower chest."],
    ["Explosive pull-up to the hips", "3 × 3", "Pull fast and drive the bar toward your waist."],
    ["Muscle-up transition on a low bar", "3 × 5", "Feet on the floor, practise rolling the wrists over the bar."],
    ["Muscle-up negatives", "3 × 3, 5s down", "Start above the bar and lower slowly through the transition."],
    ["Band-assisted muscle-up", "3 × 3", "A band takes some weight so you can practise the full movement."],
    ["Muscle-up", "3 × 2", "A small kip is fine. Lean over the bar at the top."],
    ["Strict muscle-up", "3 × 2", "No kip or swing."]
  ], related: ["pull-ups", "dips", "chin-ups"], alts: ["Ring muscle-up"] },

  "k-front-lever": { name: "Front lever", focus: "Lats · core · straight-arm pulling", start: 0, steps: [
    ["Tuck front lever", "3 × 10s", "Knees to chest, back flat, body level under the bar. Arms straight."],
    ["Advanced tuck front lever", "3 × 8s", "Hips open so the back is flat and the knees move away."],
    ["One-leg front lever", "3 × 6s per side", "One leg straight, the other tucked."],
    ["Straddle front lever", "3 × 5s", "Legs straight and wide."],
    ["Full front lever", "3 × 3s", "Legs together, body straight and horizontal."],
    ["Front lever raises", "3 × 5", "From a hang, raise to the front lever and lower slowly."]
  ], related: ["rows", "pull-ups", "scap-pull", "hollow"], alts: ["Dragon flag"] },

  "k-back-lever": { name: "Back lever", focus: "Shoulders · straight-arm strength", start: 0, steps: [
    ["Skin the cat", "3 × 3", "From a hang, tuck and rotate backward until you hang behind, then return."],
    ["German hang", "3 × 20s", "Hang behind the bar or rings with the shoulders stretched."],
    ["Tuck back lever", "3 × 10s", "Face-down tuck with the back level. Arms straight."],
    ["Advanced tuck back lever", "3 × 8s", "Open the hips so the back is flat."],
    ["Straddle back lever", "3 × 5s", "Legs straight and wide, body horizontal."],
    ["Full back lever", "3 × 5s", "Legs together, body straight."]
  ], related: ["back-bridge", "scap-pull", "chin-ups"], alts: ["Front lever"] },

  "k-human-flag": { name: "Human flag", focus: "Obliques · shoulders", start: 0, steps: [
    ["Side plank, 45 seconds", "3 × 45s per side", "Body straight, hips high."],
    ["Vertical flag hold", "3 × 10s", "On a pole, top arm pulls and bottom arm pushes with the body vertical."],
    ["Tuck flag", "3 × 5s", "Knees tucked, body tilted toward horizontal."],
    ["Straddle flag", "3 × 5s", "Legs wide, body as level as you can hold."],
    ["Human flag", "3 × 3s", "Legs together, body horizontal."]
  ], related: ["plank", "hollow"], alts: ["Side plank"] },

  "k-rope-climb": { name: "Rope climb", focus: "Grip · pulling", start: 0, steps: [
    ["Rope hang", "3 × 20s", "Hang from the rope with both hands."],
    ["Seated rope pull-up", "3 × 5", "Sit under the rope and pull yourself up to standing."],
    ["Rope climb with legs", "3 × 1", "Lock the rope between your feet to rest as you climb."],
    ["Rope climb, arms only", "3 × 1", "Climb hand over hand with the legs in an L or hanging."]
  ], related: ["pull-ups", "chin-ups"], alts: ["Towel pull-up"] },

  "k-face-pull": { name: "Face pulls", focus: "Rear delts · upper back", start: 1, steps: [
    ["Band pull-apart", "3 × 15", "Arms straight, pull the band apart to your chest."],
    ["Band face pull", "3 × 15", "Pull the band toward your forehead, elbows high."],
    ["Ring face pull, high incline", "3 × 12", "Lean back on rings and pull your hands beside your face."],
    ["Ring face pull, low incline", "3 × 10", "Walk the feet forward so you lean back further."]
  ], related: ["rows", "scap-pull"], alts: ["Prone Y raise"] },

  "k-bicep-curl": { name: "Bodyweight bicep curls", focus: "Biceps", start: 0, steps: [
    ["Ring bicep curl, high incline", "3 × 12", "Palms up, elbows fixed in front, curl the rings to your forehead."],
    ["Ring bicep curl", "3 × 10", "Lean back further."],
    ["Low ring bicep curl", "3 × 8", "Body close to horizontal."],
    ["Chin-up top hold", "3 × 20s", "Hold the top of a chin-up with the chin over the bar."]
  ], related: ["chin-ups", "rows"], alts: ["Close-grip chin-up"] },

  "k-grip": { name: "Grip strength", focus: "Forearms · grip", start: 0, steps: [
    ["Towel hang", "3 × 20s", "Hang from two towels looped over the bar."],
    ["Assisted one-arm hang", "3 × 15s per arm", "One hand on the bar, the other lightly on a band or towel."],
    ["One-arm dead hang", "3 × 15s per arm", "Full weight on one hand. Keep the shoulder engaged."],
    ["Towel pull-up", "3 × 5", "Pull-ups gripping two towels."]
  ], related: ["scap-pull", "pull-ups"], alts: ["Fingertip push-up"] },

  // Legs
  "k-pistol": { name: "Pistol squat", focus: "Quads · balance · mobility", start: 1, steps: [
    ["Box pistol squat", "3 × 6 per side", "Sit down to a box on one leg, the other leg forward."],
    ["Assisted pistol squat", "3 × 6 per side", "Hold a post or band for balance through the full range."],
    ["Pistol squat negative", "3 × 5 per side", "Lower slowly on one leg, stand up with both."],
    ["Pistol squat", "3 × 5 per side", "Full depth on one leg, free leg straight out front."],
    ["Weighted pistol squat", "3 × 5 per side", "Hold a weight out in front."]
  ], related: ["bss", "sissy", "horse-stance"], alts: ["Shrimp squat"] },

  "k-cossack": { name: "Cossack squat", focus: "Adductors · hips · mobility", start: 1, steps: [
    ["Assisted Cossack squat", "3 × 8 per side", "Hold a support. Shift to one side with the other leg straight."],
    ["Cossack squat", "3 × 8 per side", "No support. Heel of the working foot stays down."],
    ["Deep Cossack squat", "3 × 8 per side", "Sit all the way down with the straight leg toes up."],
    ["Loaded Cossack squat", "3 × 8 per side", "Hold a weight at the chest."]
  ], related: ["horse-stance", "bss"], alts: ["Lateral lunge"] },

  "k-lunge": { name: "Lunges", focus: "Quads · glutes", start: 1, steps: [
    ["Static lunge", "3 × 10 per side", "Feet split, drop the back knee straight down."],
    ["Reverse lunge", "3 × 10 per side", "Step back into the lunge and drive back up."],
    ["Walking lunge", "3 × 12 per side", "Step forward into each lunge without stopping."],
    ["Deficit reverse lunge", "3 × 10 per side", "Front foot on a step for more depth."],
    ["Jumping lunge", "3 × 8 per side", "Switch legs in the air."]
  ], related: ["bss", "jump-squats"], alts: ["Curtsy lunge"] },

  "k-squat": { name: "Bodyweight squat", focus: "Quads · glutes · mobility", start: 1, steps: [
    ["Box squat", "3 × 15", "Sit back to a box and stand up without rocking."],
    ["Bodyweight squat", "3 × 20", "Full depth, heels down, chest up."],
    ["Pause squat", "3 × 12, 3s hold", "Hold the bottom for three seconds."],
    ["Deep squat hold", "3 × 60s", "Sit in the bottom of the squat and relax into it."],
    ["Narrow-stance squat", "3 × 15", "Feet together. Knees travel forward over the toes."]
  ], related: ["jump-squats", "horse-stance", "bss"], alts: ["Goblet squat"] },

  "k-wall-sit": { name: "Wall sit", focus: "Quads · endurance", start: 1, steps: [
    ["High wall sit", "3 × 30s", "Back on the wall, knees bent about halfway."],
    ["Wall sit", "3 × 60s", "Thighs parallel to the floor, knees over the ankles."],
    ["Wall sit, 2 minutes", "2 × 2 min", "Same position for two minutes."],
    ["Single-leg wall sit", "3 × 30s per side", "One foot lifted off the floor."],
    ["Loaded wall sit", "3 × 60s", "Hold a weight on your thighs."]
  ], related: ["horse-stance", "sissy", "bss"], alts: ["Spanish squat"] },

  "k-nordic": { name: "Nordic curl", focus: "Hamstrings", start: 0, steps: [
    ["Hamstring walkout", "3 × 8", "From a bridge, walk the heels out and back in."],
    ["Slider hamstring curl", "3 × 8", "Heels on a towel, hips up, curl the heels in."],
    ["Single-leg slider curl", "3 × 6 per side", "Same curl on one leg."],
    ["Band-assisted Nordic curl negative", "3 × 5", "Ankles anchored, lower forward slowly with a band helping."],
    ["Nordic curl negative", "3 × 5", "Lower as slowly as you can, push back up with the hands."],
    ["Nordic curl", "3 × 3", "Lower and pull yourself back up with the hamstrings."]
  ], related: ["bss", "back-bridge"], alts: ["Single-leg deadlift"] },

  "k-hip-thrust": { name: "Hip thrust", focus: "Glutes", start: 1, steps: [
    ["Glute bridge, 2s hold", "3 × 12", "Drive the hips up and squeeze for two seconds."],
    ["Feet-elevated glute bridge", "3 × 12", "Feet on a step for a bigger range."],
    ["Hip thrust", "3 × 12", "Shoulders on a bench, drive the hips up level with the knees."],
    ["Single-leg glute bridge", "3 × 10 per side", "One leg up, hips stay level."],
    ["Single-leg hip thrust", "3 × 10 per side", "Shoulders on a bench, one leg working."]
  ], related: ["back-bridge", "bss"], alts: ["Frog pump"] },

  "k-sl-deadlift": { name: "Single-leg deadlift", focus: "Hamstrings · glutes · balance", start: 1, steps: [
    ["Assisted single-leg deadlift", "3 × 8 per side", "Fingertips on a wall. Hinge forward with the back leg straight."],
    ["Single-leg deadlift", "3 × 8 per side", "No support. Hips square to the floor."],
    ["Single-leg deadlift, floor reach", "3 × 10 per side", "Reach the hand to the floor at the bottom."],
    ["Loaded single-leg deadlift", "3 × 8 per side", "Hold a backpack or weight."],
    ["Hip airplane", "3 × 5 per side", "In the hinge, rotate the hips open and closed."]
  ], related: ["bss", "calf-raises"], alts: ["Nordic curl"] },

  "k-step-up": { name: "Step-ups", focus: "Quads · glutes", start: 1, steps: [
    ["Low step-up", "3 × 12 per side", "Step onto a low step, stand tall at the top."],
    ["Step-up", "3 × 10 per side", "Knee-height box. Push through the top foot only."],
    ["High step-up", "3 × 8 per side", "Higher box, slow on the way down."],
    ["Loaded step-up", "3 × 8 per side", "Add a backpack."]
  ], related: ["bss", "jump-squats"], alts: ["Lateral step-up"] },

  "k-reverse-nordic": { name: "Reverse Nordic", focus: "Quads · hip flexors", start: 0, steps: [
    ["Partial reverse Nordic", "3 × 8", "Kneel upright, lean back a little with hips straight, return."],
    ["Reverse Nordic", "3 × 8", "Lean back as far as you control."],
    ["Slow reverse Nordic", "3 × 6, 3s down", "Three seconds back, then return."]
  ], related: ["sissy", "bss"], alts: ["Sissy squat"] },

  "k-tibialis": { name: "Tibialis raises", focus: "Shins · ankles", start: 0, steps: [
    ["Wall tibialis raise", "3 × 15", "Back on a wall, heels forward, lift the toes."],
    ["Tibialis raise, feet further out", "3 × 20", "Walk the feet further from the wall."],
    ["Single-leg tibialis raise", "3 × 12 per side", "One foot at a time."]
  ], related: ["calf-raises"], alts: ["Toe walks"] },

  "k-skater": { name: "Skater squat", focus: "Quads · balance", start: 0, steps: [
    ["Skater squat to a box", "3 × 6 per side", "Stand on one leg, lower the back knee to a cushion."],
    ["Skater squat", "3 × 6 per side", "Back knee touches the floor lightly."],
    ["Skater squat, hands behind", "3 × 5 per side", "Hands behind the back, no counterbalance."]
  ], related: ["bss", "sissy"], alts: ["Pistol squat"] },

  // Core and conditioning
  "k-side-plank": { name: "Side plank", focus: "Obliques · hips", start: 1, steps: [
    ["Knee side plank", "3 × 30s per side", "Elbow under the shoulder, knees down, hips up."],
    ["Side plank", "3 × 30s per side", "Feet stacked, body in a straight line."],
    ["Side plank, 60 seconds", "3 × 60s per side", "Same hold for a full minute."],
    ["Side plank with leg raised", "3 × 30s per side", "Lift the top leg and hold."],
    ["Short Copenhagen plank", "3 × 20s per side", "Top knee on a bench, bottom leg free."],
    ["Copenhagen plank", "3 × 20s per side", "Top foot on a bench, body straight."]
  ], related: ["plank", "hollow"], alts: ["Human flag"] },

  "k-dragon-flag": { name: "Dragon flag", focus: "Core · full-body tension", start: 0, steps: [
    ["Lying leg raise", "3 × 12", "Hands by the hips, lower back pressed down."],
    ["Reverse crunch", "3 × 12", "Curl the hips off the floor at the top."],
    ["Tuck dragon flag", "3 × 5", "Hold a bench behind your head, lift onto the shoulders with knees tucked."],
    ["Dragon flag negative", "3 × 5", "Lower the straight body slowly from the top."],
    ["One-leg dragon flag", "3 × 4 per side", "One leg straight, the other tucked."],
    ["Dragon flag", "3 × 5", "Lower and raise with the body straight."]
  ], related: ["hollow", "hanging-leg-raise", "plank"], alts: ["Ab wheel rollout"] },

  "k-arch-hold": { name: "Arch body hold", focus: "Lower back · glutes", start: 1, steps: [
    ["Bird dog", "3 × 10 per side", "On hands and knees, reach the opposite arm and leg."],
    ["Superman hold", "3 × 20s", "Face down, lift arms and legs together."],
    ["Arch body hold", "3 × 30s", "Arms by the ears, squeeze glutes, chest and legs up."],
    ["Arch rocks", "3 × 15", "Keep the arch and rock from chest to thighs."],
    ["Back extension, hands behind head", "3 × 12", "Lie face down, lift the chest with hands behind your head."]
  ], related: ["back-bridge", "hollow"], alts: ["Prone Y raise"] },

  "k-rotation": { name: "Russian twists", focus: "Obliques · rotation", start: 0, steps: [
    ["Seated Russian twist", "3 × 20", "Lean back with feet down, rotate shoulder to shoulder."],
    ["Russian twist, feet up", "3 × 20", "Feet off the floor."],
    ["Hanging oblique knee raise", "3 × 8 per side", "From a hang, raise the knees to one side."]
  ], related: ["hanging-leg-raise", "plank"], alts: ["Windshield wipers"] },

  "k-burpee": { name: "Burpees", focus: "Conditioning · full body", start: 1, steps: [
    ["Step-back burpee", "3 × 10", "Step the feet back and in instead of jumping."],
    ["Burpee", "3 × 10", "Jump back to a plank, jump in, jump up."],
    ["Burpee with push-up", "3 × 10", "Add a full push-up at the bottom."],
    ["Burpee tuck jump", "3 × 8", "Finish each rep with a tuck jump."]
  ], related: ["jump-squats", "push-ups"], alts: ["Mountain climbers"] },

  "k-bear-crawl": { name: "Bear crawl", focus: "Shoulders · core · coordination", start: 0, steps: [
    ["Bear plank hold", "3 × 30s", "Hands and toes down, knees just off the floor."],
    ["Bear crawl", "3 × 20 steps", "Move opposite hand and foot together, knees low."],
    ["Backward bear crawl", "3 × 20 steps", "Same pattern moving backward."],
    ["Lateral bear crawl", "3 × 20 steps", "Move sideways, keeping the hips level."]
  ], related: ["plank", "push-ups"], alts: ["Crab walk"] },

  "k-mountain-climber": { name: "Mountain climbers", focus: "Conditioning · core", start: 1, steps: [
    ["Slow mountain climber", "3 × 20", "From a plank, bring one knee to the chest at a time."],
    ["Mountain climber", "3 × 30s", "Fast alternating knees, hips level."],
    ["Cross-body mountain climber", "3 × 30s", "Drive each knee toward the opposite elbow."]
  ], related: ["plank", "jump-squats"], alts: ["Burpees"] }
};

// Other names people use, pointing at [exercise id, step index] (-1 = the exercise itself).
const ALIASES = {
  "Crow pose": ["frog-stance", 4],
  "Crow": ["frog-stance", 4],
  "Australian row": ["rows", 1],
  "Inverted row": ["rows", 1],
  "Ring row": ["rows", 0],
  "Negative pull-up": ["pull-ups", 0],
  "Ring dips": ["dips", 5],
  "Handstand push-up": ["pike-pu", 5],
  "HSPU": ["pike-pu", 5],
  "Wall handstand": ["k-handstand", 2],
  "Squat": ["k-squat", 1],
  "Air squat": ["jump-squats", 0],
  "Jump squat": ["jump-squats", 2],
  "Calf raise": ["calf-raises", 0],
  "Single-leg calf raise": ["calf-raises", 2],
  "Glute bridge": ["back-bridge", 0],
  "Ab wheel rollout": ["plank", 5],
  "Superman": ["k-arch-hold", 1],
  "Copenhagen plank": ["k-side-plank", 5],
  "Split squat": ["bss", 0],
  "Pistol": ["k-pistol", 3],
  "Lunge": ["k-lunge", 0],
  "Dead bug": ["hollow", 0],
  "V-sit": ["l-sit", 5],
  "Front lever": ["k-front-lever", -1],
  "Back lever": ["k-back-lever", -1],
  "Planche": ["k-planche", -1],
  "Muscle-up": ["k-muscle-up", -1]
};
